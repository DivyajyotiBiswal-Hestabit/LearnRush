import { tokenize } from '@/lib/rag/bm25'

/**
 * Simple lexical reranker — uses multiple signals to score chunks
 */
export function lexicalRerank(query, chunks) {
  const queryTerms = new Set(tokenize(query))
  const queryWords = query.toLowerCase().split(/\s+/)

  return chunks.map(chunk => {
    const content = chunk.content ?? ''
    const chunkTerms = new Set(tokenize(content))

    // Signal 1: Term overlap ratio
    let overlapCount = 0
    queryTerms.forEach(term => {
      if (chunkTerms.has(term)) overlapCount++
    })
    const termOverlap = queryTerms.size > 0 ? overlapCount / queryTerms.size : 0

    // Signal 2: Exact phrase matches (bigrams)
    let phraseMatches = 0
    for (let i = 0; i < queryWords.length - 1; i++) {
      const bigram = `${queryWords[i]} ${queryWords[i + 1]}`
      if (content.toLowerCase().includes(bigram)) phraseMatches++
    }
    const phraseScore = queryWords.length > 1
      ? phraseMatches / (queryWords.length - 1)
      : 0

    // Signal 3: Content length penalty
    const contentWords = content.split(/\s+/).length
    const lengthScore = contentWords >= 50 && contentWords <= 500
      ? 1.0
      : contentWords < 50
        ? contentWords / 50
        : 500 / contentWords

    // Signal 4: Position bonus
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
export async function llmRerank(query, chunks, modelId = 'llama-3.1-8b-instant', topN = 5) {
  if (chunks.length <= topN) return chunks

  const candidates = chunks.slice(0, Math.min(chunks.length, topN * 2))

  // Simpler prompt — less chance of model adding extra text
  const prompt = `Query: "${query}"

Score each passage 0-10 for relevance to the query.

${candidates.map((c, i) => `Passage ${i}: ${c.content.slice(0, 120)}`).join('\n\n')}

Reply with ONLY a JSON array of ${candidates.length} numbers. Example: [7,3,9,1,5]`

  try {
    const { isGroqAvailable, groqChat } = await import('@/lib/groq')
    const { ollamaChat } = await import('@/lib/ollama')

    let response = ''

    if (isGroqAvailable()) {
      response = await groqChat(
        'llama-3.1-8b-instant',  // always use fast Groq model, ignore passed modelId
        [{ role: 'user', content: prompt }],
        { temperature: 0, max_tokens: 80 }
      )
    } else {
      response = await ollamaChat(
        'phi3:latest',
        [{ role: 'user', content: prompt }],
        { temperature: 0, num_predict: 80 }
      )
    }

    console.log('[LLMRerank] Raw response:', response.slice(0, 100))

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from model')
    }

    // Try multiple extraction strategies
    let scores = null

    // Strategy 1: Find JSON array anywhere in response
    const arrayMatch = response.match(/\[[\d\s,\.]+\]/)
    if (arrayMatch) {
      try {
        scores = JSON.parse(arrayMatch[0])
      } catch {
        // try next strategy
      }
    }

    // Strategy 2: Extract just the numbers
    if (!scores) {
      const numbers = response.match(/\b(\d+(?:\.\d+)?)\b/g)
      if (numbers && numbers.length >= candidates.length) {
        scores = numbers.slice(0, candidates.length).map(Number)
      }
    }

    // Strategy 3: Split by comma/space
    if (!scores) {
      const cleaned = response.replace(/[^\d,.\s]/g, '').trim()
      const parts = cleaned.split(/[,\s]+/).filter(Boolean)
      if (parts.length >= candidates.length) {
        scores = parts.slice(0, candidates.length).map(Number)
      }
    }

    if (!scores || scores.length === 0) {
      throw new Error(`Could not parse scores from: "${response.slice(0, 80)}"`)
    }

    // Pad scores if model returned fewer than expected
    while (scores.length < candidates.length) {
      scores.push(5)
    }

    console.log('[LLMRerank] Parsed scores:', scores.slice(0, candidates.length))

    return candidates
      .map((chunk, i) => ({
        ...chunk,
        llmScore: Math.min(10, Math.max(0, scores[i] ?? 5)) / 10,
        finalScore:
          (Math.min(10, Math.max(0, scores[i] ?? 5)) / 10) * 0.5 +
          (chunk.rerankScore ?? 0) * 0.5,
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topN)

  } catch (err) {
    console.error('[LLMRerank] Failed, falling back to lexical:', err.message)
    return chunks.slice(0, topN)
  }
}