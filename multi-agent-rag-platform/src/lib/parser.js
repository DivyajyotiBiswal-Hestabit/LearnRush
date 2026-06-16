/**
 * Extract text from a PDF buffer using unpdf
 */
export async function parsePDF(buffer) {
  try {
    const { extractText } = await import('unpdf')
    const uint8Array = new Uint8Array(buffer)
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true })

    return {
      text: text.trim(),
      pageCount: totalPages,
      info: {},
    }
  } catch (error) {
    console.error('PDF parse error:', error)
    throw new Error(`Failed to parse PDF: ${error.message}`)
  }
}

/**
 * Extract text from a plain text file buffer
 */
export function parseTXT(buffer) {
  return {
    text: buffer.toString('utf-8'),
    pageCount: 1,
    info: {},
  }
}

/**
 * Route to the correct parser based on file type
 */
export async function parseDocument(buffer, fileType) {
  const type = fileType.toLowerCase()

  if (type === 'application/pdf' || type.includes('pdf')) {
    return parsePDF(buffer)
  }

  if (type === 'text/plain' || type.includes('txt')) {
    return parseTXT(buffer)
  }

  if (type.includes('image')) {
    return {
      text: '[Image document — text extraction for images coming in Phase 13]',
      pageCount: 1,
      info: { isImage: true },
    }
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}