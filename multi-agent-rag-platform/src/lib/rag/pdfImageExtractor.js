/**
 * Extract images from PDF pages by rendering each page as an image
 * then passing to vision/OCR pipeline
 */

/**
 * Render PDF pages as images using pdfjs-dist
 * Returns array of page image buffers
 */
export async function renderPDFPagesToImages(pdfBuffer, options = {}) {
  const { maxPages = 20, scale = 1.5 } = options

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('canvas')

    const workerPath = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url
    )
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath.toString()

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
    }).promise

    const pageCount = Math.min(pdf.numPages, maxPages)
    const pageImages = []

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })

        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')

        await page.render({ canvasContext: context, viewport }).promise

        const imageBuffer = canvas.toBuffer('image/png')
        pageImages.push({
          pageNumber: pageNum,
          buffer: imageBuffer,
          width: viewport.width,
          height: viewport.height,
        })
      } catch (pageError) {
        console.error(`Failed to render page ${pageNum}:`, pageError)
      }
    }

    return pageImages
  } catch (error) {
    console.error('PDF page rendering failed:', error)
    return []
  }
}

/**
 * Check if a page has significant visual content
 * by comparing text density to page area
 */
export function isPageVisuallyRich(pageText, pageWidth, pageHeight) {
  const textLength = pageText?.trim().length ?? 0
  const expectedTextForPage = (pageWidth * pageHeight) / 1000
  return textLength < expectedTextForPage * 0.1
}