import { ollamaChat } from '@/lib/ollama'
import { tokenize } from '@/lib/rag/bm25'

/**
 * Simple lexical reranker — uses multiple signals to score chunks
 */
export function lexicalRerank(query, chunks) {
  const queryTerms = new Set(tokenize(query))
  const queryLength = query.split(/\s+/).length

  return chunks.map(chunk => {
    const content = chunk.content ?? ''
    const chunkTerms = new Set(tokenize(content))

    // Signal 1: Term overlap ratio
    let overlapCount = 0
    queryTerms.forEach(term => {
      if (chunkTerms.has(term)) overlapCount++
    })
    const termOverlap = queryTerms.size > 0 ? overlapCount / queryTerms.size : 0

    // Signal 2: Exact phrase matches (partial)
    const queryWords = query.toLowerCase().split(/\s+/)
    let phraseMatches = 0
    for (let i = 0; i < queryWords.length - 1; i++) {
      const bigram = `${queryWords[i]} ${queryWords[i + 1]}`
      if (content.toLowerCase().includes(bigram)) phraseMatches++
    }
    const phraseScore = queryWords.length > 1 ? phraseMatches / (queryWords.length - 1) : 0

    // Signal 3: Content length penalty (avoid too short or too long chunks)
    const contentWords = content.split(/\s+/).length
    const lengthScore = contentWords >= 50 && contentWords <= 500 ? 1.0 :
      contentWords < 50 ? contentWords / 50 :
      500 / contentWords

    // Signal 4: Position bonus (earlier chunks tend to be more important)
    const positionScore = 1 / (1 + (chunk.chunk_index ?? 0) * 0.05)

    // Signal 5: Heading/title bonus
    const hasHeading = /^#{1,3}\s|^[A-Z][^.]{0,50}$/.test(content.trim().split('\n')[0])
    const headingBonus = hasHeading ? 0.1 : 0

    // Combine signals
    const rerankScore =
      termOverlap * 0.4 +
      phraseScore * 0.3 +
      lengthScore * 0.1 +
      positionScore * 0.1 +
      headingBonus +
      (chunk.vector_score ?? 0) * 0.3 +
      (chunk.keyword_score ?? 0) * 0.1

    return { ...chunk, rerankScore }
  })
  .sort((a, b) => b.rerankScore - a.rerankScore)
}

/**
 * LLM-based reranker — uses model to score relevance
 * Only use for top N candidates (expensive)
 */
export async function llmRerank(query, chunks, modelId = 'phi3:latest', topN = 5) {
  if (chunks.length <= topN) return chunks

  // Only rerank top candidates to save time
  const candidates = chunks.slice(0, Math.min(chunks.length, topN * 2))

  const prompt = `You are a relevance scoring system. Score each passage's relevance to the query.

Query: "${query}"

Passages:
${candidates.map((c, i) => `[${i}] ${c.content.slice(0, 200)}...`).join('\n\n')}

Respond ONLY with a JSON array of scores from 0-10 for each passage in order:
[8, 3, 9, 2, 7, ...]

Scores only, no explanation.`

  try {
    const response = await ollamaChat(modelId, [
      { role: 'user', content: prompt }
    ], { temperature: 0.1 })

    const cleaned = response.replace(/```json|```/g, '').trim()
    const scores = JSON.parse(cleaned)

    if (!Array.isArray(scores)) throw new Error('Invalid scores format')

    const scored = candidates.map((chunk, i) => ({
      ...chunk,
      llmScore: scores[i] ?? 5,
    }))

    // Combine LLM score with existing scores
    return scored
      .map(c => ({
        ...c,
        finalScore: (c.llmScore / 10) * 0.5 + (c.rerankScore ?? 0) * 0.5,
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topN)
  } catch (err) {
    console.error('LLM rerank failed, falling back to lexical:', err.message)
    return chunks.slice(0, topN)
  }
}