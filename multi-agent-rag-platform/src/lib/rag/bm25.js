import { removeStopwords } from 'stopword'

/**
 * Tokenize text into terms for BM25
 */
export function tokenize(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)

  return removeStopwords(tokens)
}

/**
 * Calculate BM25 score for a document given a query
 * BM25 parameters: k1=1.5, b=0.75
 */
export function bm25Score(queryTerms, docTokens, avgDocLength, k1 = 1.5, b = 0.75) {
  const docLength = docTokens.length
  const termFreq = {}

  docTokens.forEach(token => {
    termFreq[token] = (termFreq[token] ?? 0) + 1
  })

  let score = 0

  for (const term of queryTerms) {
    const tf = termFreq[term] ?? 0
    if (tf === 0) continue

    const numerator = tf * (k1 + 1)
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength))
    score += numerator / denominator
  }

  return score
}

/**
 * Score a list of chunks against a query using BM25
 * Returns chunks with bm25Score added, sorted by score descending
 */
export function rankChunksByBM25(query, chunks) {
  const queryTerms = tokenize(query)

  if (queryTerms.length === 0) {
    return chunks.map(c => ({ ...c, bm25Score: 0 }))
  }

  // Tokenize all chunks
  const tokenizedChunks = chunks.map(c => ({
    chunk: c,
    tokens: tokenize(c.content),
  }))

  const avgDocLength =
    tokenizedChunks.reduce((sum, tc) => sum + tc.tokens.length, 0) /
    (tokenizedChunks.length || 1)

  return tokenizedChunks
    .map(({ chunk, tokens }) => ({
      ...chunk,
      bm25Score: bm25Score(queryTerms, tokens, avgDocLength),
    }))
    .sort((a, b) => b.bm25Score - a.bm25Score)
}