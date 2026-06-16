import { ollamaChat } from '@/lib/ollama'

/**
 * Generate a text description of an image for RAG indexing
 * Uses LLaVA if available, falls back to filename-based description
 */
export async function describeImage(imageBuffer, fileName, modelId = 'llava') {
  try {
    // Convert buffer to base64
    const base64 = imageBuffer.toString('base64')

    // Try LLaVA multimodal model
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        prompt: 'Describe this image in detail, including any text, charts, diagrams, or data you can see. Focus on information that would be useful for answering research questions.',
        images: [base64],
        stream: false,
      }),
    })

    if (!response.ok) throw new Error('LLaVA not available')

    const data = await response.json()
    return {
      description: data.response,
      method: 'llava',
      hasText: data.response.toLowerCase().includes('text') ||
                data.response.toLowerCase().includes('label'),
    }
  } catch (err) {
    console.warn('Image description via LLaVA failed:', err.message)

    // Fallback: use filename as basic description
    const cleanName = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .toLowerCase()

    return {
      description: `Image file: ${cleanName}. This image could not be automatically analyzed.`,
      method: 'filename_fallback',
      hasText: false,
    }
  }
}

/**
 * Extract table data from text content and convert to structured format
 */
export function extractTablesFromText(text) {
  const tables = []

  // Detect markdown tables
  const mdTableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/gm
  let match

  while ((match = mdTableRegex.exec(text)) !== null) {
    const headerRow = match[1].split('|').map(h => h.trim()).filter(Boolean)
    const dataRows = match[2]
      .split('\n')
      .filter(row => row.includes('|'))
      .map(row => row.split('|').map(cell => cell.trim()).filter(Boolean))

    tables.push({
      type: 'markdown',
      headers: headerRow,
      rows: dataRows,
      text: match[0],
      description: `Table with columns: ${headerRow.join(', ')}`,
    })
  }

  // Detect CSV-like tables (comma-separated with consistent columns)
  const lines = text.split('\n')
  let csvTableStart = -1
  let csvColumns = 0

  for (let i = 0; i < lines.length; i++) {
    const commaCount = (lines[i].match(/,/g) ?? []).length
    if (commaCount >= 2) {
      if (csvTableStart === -1) {
        csvTableStart = i
        csvColumns = commaCount
      }
    } else {
      if (csvTableStart !== -1 && i - csvTableStart >= 2) {
        const tableLines = lines.slice(csvTableStart, i)
        const headers = tableLines[0].split(',').map(h => h.trim())
        tables.push({
          type: 'csv',
          headers,
          rows: tableLines.slice(1).map(l => l.split(',').map(c => c.trim())),
          description: `Data table with columns: ${headers.join(', ')}`,
        })
      }
      csvTableStart = -1
    }
  }

  return tables
}

/**
 * Generate a searchable text representation of a table
 */
export function tableToSearchableText(table) {
  if (!table.headers?.length) return table.description ?? ''

  let text = `Table: ${table.description}\n`
  text += `Columns: ${table.headers.join(', ')}\n`

  if (table.rows?.length) {
    text += `Data:\n`
    table.rows.slice(0, 20).forEach(row => {
      const rowText = table.headers
        .map((h, i) => `${h}: ${row[i] ?? ''}`)
        .join(', ')
      text += `- ${rowText}\n`
    })
    if (table.rows.length > 20) {
      text += `... and ${table.rows.length - 20} more rows\n`
    }
  }

  return text
}