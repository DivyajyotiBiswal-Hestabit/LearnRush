/**
 * Split text into overlapping chunks for RAG
 * @param {string} text - full document text
 * @param {number} chunkSize - characters per chunk (default 1000)
 * @param {number} overlap - overlap between chunks (default 200)
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) return []

  // Clean the text first
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim()

  const chunks = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + chunkSize

    // Try to break at a sentence boundary
    if (end < cleaned.length) {
      const sentenceEnd = cleaned.lastIndexOf('.', end)
      const newlineEnd = cleaned.lastIndexOf('\n', end)
      const breakPoint = Math.max(sentenceEnd, newlineEnd)

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1
      }
    }

    const chunk = cleaned.slice(start, end).trim()
    if (chunk.length > 50) { // skip very small chunks
      chunks.push(chunk)
    }

    start = end - overlap
    if (start >= cleaned.length) break
  }

  return chunks
}

/**
 * Split text by paragraphs first, then chunk large paragraphs
 */
export function chunkByParagraph(text, maxChunkSize = 1500) {
  if (!text || text.trim().length === 0) return []

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30)

  const chunks = []
  let currentChunk = ''

  for (const para of paragraphs) {
    if (para.length > maxChunkSize) {
      // Paragraph itself is too big — split it
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      const subChunks = chunkText(para, maxChunkSize, 150)
      chunks.push(...subChunks)
    } else if ((currentChunk + '\n\n' + para).length > maxChunkSize) {
      // Adding this paragraph would exceed limit
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())

  return chunks
}