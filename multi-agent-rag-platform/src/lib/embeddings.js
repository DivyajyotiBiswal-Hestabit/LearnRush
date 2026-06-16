const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const EMBEDDING_MODEL = 'nomic-embed-text'

/**
 * Generate an embedding vector for a single text string
 */
export async function generateEmbedding(text) {
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
  return data.embedding // array of floats, length 768
}

/**
 * Generate embeddings for multiple texts in sequence
 * (Ollama doesn't support batch embedding natively)
 */
export async function generateEmbeddings(texts) {
  const embeddings = []
  for (const text of texts) {
    const embedding = await generateEmbedding(text)
    embeddings.push(embedding)
  }
  return embeddings
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