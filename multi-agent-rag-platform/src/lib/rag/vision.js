const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const VISION_MODEL = 'llava'

/**
 * Check if LLaVA is available
 */
export async function isVisionAvailable() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    const data = await res.json()
    return data.models?.some(m => m.name.includes('llava')) ?? false
  } catch {
    return false
  }
}

/**
 * Describe an image using LLaVA
 * @param {Buffer} imageBuffer - raw image buffer
 * @param {string} context - additional context about what this image is from
 * @param {string} type - 'image' | 'chart' | 'table' | 'diagram' | 'scanned'
 */
export async function describeImageWithVision(imageBuffer, context = '', type = 'image') {
  const base64 = imageBuffer.toString('base64')

  const prompts = {
    image: `Describe this image in detail. Focus on:
- What is shown in the image
- Any text visible in the image
- Key visual elements, objects, or people
- Any data, numbers, or statistics shown
- The context this image seems to be from: ${context}
Be thorough — this description will be used for document search.`,

    chart: `Analyze this chart or graph in detail:
- What type of chart is this (bar, line, pie, scatter, etc.)
- What is the title or main topic
- What are the axes labels and units
- Describe the data trends and key data points
- What conclusions can be drawn from this chart
- Any specific numbers, percentages, or values visible
Context: ${context}`,

    table: `Extract and describe this table:
- What is the table about
- List all column headers
- Describe the data in each row (or summarize if many rows)
- Note any totals, subtotals, or summary rows
- Highlight the most important data points
Context: ${context}`,

    diagram: `Describe this diagram or flowchart:
- What process or concept does it illustrate
- Describe the flow or relationships shown
- List all labeled components or steps
- Explain what the diagram communicates overall
Context: ${context}`,

    scanned: `This appears to be a scanned document. Please:
- Extract ALL text you can read from this image
- Preserve the structure (headings, paragraphs, lists)
- Note any tables or figures and describe them
- If text is unclear, indicate [unclear] rather than guessing
Context: ${context}`,
  }

  const prompt = prompts[type] ?? prompts.image

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISION_MODEL,
        prompt,
        images: [base64],
        stream: false,
        options: { temperature: 0.1, num_ctx: 4096 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      description: data.response?.trim() ?? '',
      model: VISION_MODEL,
      type,
    }
  } catch (error) {
    console.error('Vision description failed:', error)
    return {
      description: `[${type} — vision description unavailable: ${error.message}]`,
      model: null,
      type,
      error: error.message,
    }
  }
}

/**
 * Classify what type of visual content an image contains
 */
export async function classifyImageContent(imageBuffer) {
  const base64 = imageBuffer.toString('base64')

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISION_MODEL,
        prompt: `Look at this image and classify it. Respond with ONLY one of these words:
- "chart" (if it shows a bar chart, line graph, pie chart, scatter plot, etc.)
- "table" (if it shows a data table with rows and columns)
- "diagram" (if it shows a flowchart, architecture diagram, process flow, etc.)
- "scanned" (if it appears to be a scanned handwritten or printed document)
- "photo" (if it's a photograph of a real scene or object)
- "image" (if it's any other type of image)

Respond with just the single word classification.`,
        images: [base64],
        stream: false,
        options: { temperature: 0, num_ctx: 512 },
      }),
    })

    if (!response.ok) return 'image'

    const data = await response.json()
    const classification = data.response?.trim().toLowerCase()
    const valid = ['chart', 'table', 'diagram', 'scanned', 'photo', 'image']
    return valid.includes(classification) ? classification : 'image'
  } catch {
    return 'image'
  }
}