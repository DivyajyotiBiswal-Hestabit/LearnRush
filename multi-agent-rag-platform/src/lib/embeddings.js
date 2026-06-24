const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const EMBEDDING_MODEL = 'nomic-embed-text'


const embeddingCache = new Map()

export async function generateEmbedding(text) {
  // Return cached embedding if same text was seen before
  const cacheKey = text.slice(0, 100) // use first 100 chars as key
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  const embedding = data.embedding

  // Cache it (limit cache to 100 entries)
  if (embeddingCache.size > 100) {
    const firstKey = embeddingCache.keys().next().value
    embeddingCache.delete(firstKey)
  }
  embeddingCache.set(cacheKey, embedding)

  return embedding
}
/**
 * Generate embeddings for multiple texts in sequence
 * (Ollama doesn't support batch embedding natively)
 */
export async function generateEmbeddings(texts) {
  const BATCH_SIZE = 5
  const results = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    const embeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    )

    results.push(...embeddings)
  }

  return results
}



/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dot / (magA * magB)
}