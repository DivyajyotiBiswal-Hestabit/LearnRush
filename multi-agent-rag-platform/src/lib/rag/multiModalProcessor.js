import { parseDocument } from '@/lib/parser'
import { smartChunk, chunkByParagraph } from '@/lib/chunker'
import { extractTablesFromText, tableToSearchableText } from '@/lib/rag/imageUnderstanding'
import { describeImageWithVision, classifyImageContent, isVisionAvailable } from '@/lib/rag/vision'
import { extractTextWithOCR, preprocessImageForOCR, shouldUseOCR } from '@/lib/rag/ocr'

/**
 * Detect content types present in the document
 */
function detectContentTypes(text, fileType) {
  const types = ['text']

  if (fileType?.includes('image')) {
    types.push('image')
    return types
  }

  // Check for table patterns
  if (/\|.+\|/.test(text) || /\t.+\t/.test(text)) types.push('table')

  // Check for figure/chart references
  if (/figure|fig\.|chart|graph|diagram|plot/i.test(text)) types.push('chart')

  // Check for low text density (possible scanned content)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 100 && text.length > 0) types.push('scanned')

  return types
}

/**
 * Process a plain image file (PNG, JPG, WEBP)
 */
async function processImageFile(buffer, fileName, visionAvailable) {
  const chunks = []

  // Step 1: Classify the image
  let imageType = 'image'
  if (visionAvailable) {
    imageType = await classifyImageContent(buffer)
  }

  // Step 2: Try OCR first for text extraction
  const preprocessed = await preprocessImageForOCR(buffer)
  const ocrResult = await extractTextWithOCR(preprocessed)

  // Step 3: Use vision model for rich description
  let visionDescription = null
  if (visionAvailable) {
    const context = `This is a ${imageType} from document: ${fileName}`
    const result = await describeImageWithVision(buffer, context, imageType)
    visionDescription = result.description
  }

  // Step 4: Combine OCR + vision into searchable content
  let content = ''

  if (ocrResult.text && ocrResult.confidence > 40) {
    content += `[Extracted Text]\n${ocrResult.text}\n\n`
  }

  if (visionDescription) {
    content += `[Visual Description]\n${visionDescription}`
  }

  if (!content) {
    content = `[Image: ${fileName} — content could not be extracted]`
  }

  chunks.push({
    content: content.trim(),
    type: imageType === 'scanned' ? 'scanned' : 'image',
    metadata: {
      file_name: fileName,
      image_type: imageType,
      ocr_confidence: ocrResult.confidence,
      ocr_word_count: ocrResult.words,
      vision_used: !!visionDescription,
    },
    sourceType: imageType === 'scanned' ? 'scanned' : 'image',
  })

  return chunks
}

/**
 * Process a PDF with full multi-modal support
 */
async function processPDFMultiModal(buffer, fileName, visionAvailable) {
  const chunks = []

  // Step 1: Extract text normally
  const parsed = await parseDocument(buffer, 'application/pdf')
  const textChunks = await smartChunk(parsed.text, 1200, {
    strategy: 'auto',              
    semanticThresholdWords: 3000,  
    breakpointThreshold: 0.72,
    bufferSize: 1,
  })

  // Add text chunks
  textChunks.forEach((text, i) => {
    chunks.push({  
      content: text,
      type: 'text',
      pageNumber: null,
      metadata: { file_name: fileName, chunk_index: i },
      sourceType: 'text',
    })
  })

  // Step 2: Extract tables from text
  const tables = extractTablesFromText(parsed.text)
  tables.forEach((table, i) => {
    const tableText = tableToSearchableText(table)
    if (tableText.length > 30) {
      chunks.push({
        content: tableText,
        type: 'table',
        metadata: {
          file_name: fileName,
          table_type: table.type,
          headers: table.headers,
        },
        sourceType: 'table',
      })
    }
  })

  // Step 3: Check if OCR might help (scanned PDF)
  if (shouldUseOCR(parsed.text, parsed.pageCount)) {
    console.log(`PDF appears to be scanned, attempting OCR: ${fileName}`)

    try {
      // Try to render pages as images for OCR/vision
      const { renderPDFPagesToImages } = await import('@/lib/rag/pdfImageExtractor')
      const pageImages = await renderPDFPagesToImages(buffer, { maxPages: 10 })

      for (const page of pageImages) {
        const preprocessed = await preprocessImageForOCR(page.buffer)
        const ocrResult = await extractTextWithOCR(preprocessed)

        if (ocrResult.text && ocrResult.text.trim().length > 50) {
          chunks.push({
            content: `[Scanned Page ${page.pageNumber}]\n${ocrResult.text}`,
            type: 'scanned',
            pageNumber: page.pageNumber,
            metadata: {
              file_name: fileName,
              page_number: page.pageNumber,
              ocr_confidence: ocrResult.confidence,
              source: 'ocr',
            },
            sourceType: 'scanned',
          })
        }

        // Also get vision description if available
        if (visionAvailable && ocrResult.confidence < 70) {
          const context = `Page ${page.pageNumber} of ${fileName}`
          const result = await describeImageWithVision(page.buffer, context, 'scanned')
          if (result.description && result.description.length > 50) {
            chunks.push({
              content: `[Visual Content - Page ${page.pageNumber}]\n${result.description}`,
              type: 'image',
              pageNumber: page.pageNumber,
              metadata: {
                file_name: fileName,
                page_number: page.pageNumber,
                vision_model: result.model,
                source: 'vision',
              },
              sourceType: 'image',
            })
          }
        }
      }
    } catch (renderError) {
      console.error('PDF page rendering failed:', renderError)
      // Non-fatal — we already have text chunks
    }
  }

  return { chunks, pageCount: parsed.pageCount, tables }
}

/**
 * Main multi-modal document processor
 * Routes to the right pipeline based on file type
 */
export async function processDocumentMultiModal(buffer, fileType, fileName) {
  // Check vision availability once upfront
  const visionAvailable = await isVisionAvailable()

  console.log(`Processing: ${fileName} | Type: ${fileType} | Vision: ${visionAvailable}`)

  const result = {
    chunks: [],
    pageCount: 1,
    contentTypes: [],
    tablesFound: 0,
    imagesProcessed: 0,
    ocrUsed: false,
    visionUsed: visionAvailable,
    visionModel: visionAvailable ? 'llava' : null,
  }

  const type = fileType.toLowerCase()

  // ── Image files ──────────────────────────────────────────────────────
  if (type.includes('image') || type.includes('png') || type.includes('jpg') ||
      type.includes('jpeg') || type.includes('webp') || type.includes('gif')) {

    const imageChunks = await processImageFile(buffer, fileName, visionAvailable)
    result.chunks = imageChunks
    result.contentTypes = ['image']
    result.imagesProcessed = 1
    result.ocrUsed = true

    return result
  }

  // ── PDF files ────────────────────────────────────────────────────────
  if (type.includes('pdf')) {
    const { chunks, pageCount, tables } = await processPDFMultiModal(buffer, fileName, visionAvailable)
    result.chunks = chunks
    result.pageCount = pageCount
    result.tablesFound = tables?.length ?? 0
    result.contentTypes = detectContentTypes(chunks.map(c => c.content).join(' '), fileType)
    result.ocrUsed = chunks.some(c => c.sourceType === 'scanned')

    return result
  }

  // ── Text files ───────────────────────────────────────────────────────
  if (type.includes('text') || type.includes('txt') || type.includes('md') ||
      type.includes('csv') || type.includes('json')) {

    const text = buffer.toString('utf-8')
    const textChunks = await smartChunk(text, 1200, {
      strategy: 'auto',
      semanticThresholdWords: 3000,
    })
    
    const tables = extractTablesFromText(text)

    result.chunks = [
      ...textChunks.map((content, i) => ({
        content,
        type: 'text',
        metadata: { file_name: fileName, chunk_index: i },
        sourceType: 'text',
      })),
      ...tables.map(table => ({
        content: tableToSearchableText(table),
        type: 'table',
        metadata: { file_name: fileName, table_type: table.type },
        sourceType: 'table',
      })),
    ]
    result.contentTypes = ['text', ...(tables.length > 0 ? ['table'] : [])]
    result.tablesFound = tables.length

    return result
  }

  // ── Fallback ─────────────────────────────────────────────────────────
  console.warn(`Unsupported file type: ${fileType}`)
  result.chunks = [{
    content: `[Unsupported file type: ${fileType} — ${fileName}]`,
    type: 'text',
    metadata: { file_name: fileName },
    sourceType: 'text',
  }]

  return result
}