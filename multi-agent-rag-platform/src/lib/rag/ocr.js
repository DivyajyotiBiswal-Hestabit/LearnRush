import { createWorker } from 'tesseract.js'

/**
 * OCR utility using Tesseract.js
 * Extracts text from images and scanned documents
 */
/**
 * OCR utility using Tesseract.js
 * Extracts text from images and scanned documents
 */

/**
 * Extract text from an image buffer using Tesseract OCR
 */
export async function extractTextWithOCR(imageBuffer, options = {}) {
  try {

    const worker = await createWorker('eng')

    // Convert buffer to base64 data URL
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    const { data } = await worker.recognize(dataUrl, {
      rotateAuto: options.rotateAuto ?? true,
    })

    await worker.terminate()

    return {
      text: data.text?.trim() ?? '',
      confidence: data.confidence ?? 0,
      words: data.words?.length ?? 0,
      lines: data.lines?.length ?? 0,
    }
  } catch (error) {
    console.error('OCR failed:', error)
    return {
      text: '',
      confidence: 0,
      error: error.message,
    }
  }
}

/**
 * Preprocess image for better OCR results
 * Converts to grayscale and increases contrast
 */
export async function preprocessImageForOCR(imageBuffer, mimeType = 'image/png') {
  try {
    const sharp = (await import('sharp')).default

    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize() // auto contrast
      .sharpen()
      .toBuffer()

    return processed
  } catch (error) {
    console.error('Image preprocessing failed:', error)
    return imageBuffer // return original if preprocessing fails
  }
}

/**
 * Determine if OCR is likely needed based on initial text extraction
 * If we got very little text from a page but it has images, OCR might help
 */
export function shouldUseOCR(extractedText, pageCount) {
  if (!extractedText || extractedText.trim().length === 0) return true
  const wordsPerPage = extractedText.split(/\s+/).length / Math.max(pageCount, 1)
  return wordsPerPage < 20 // less than 20 words per page suggests scanned content
}