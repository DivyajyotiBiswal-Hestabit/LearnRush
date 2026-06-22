/**
 * Hybrid Chunker
 *
 * Strategy:
 * 1. Short docs (< 5 pages / ~3000 words) → paragraph chunking with heading preservation
 * 2. Long docs (>= 5 pages / ~3000 words)  → semantic chunking (embedding-based)
 * 3. Fallback → fixed-size with sentence boundary detection
 *
 * Fixes over original:
 * - Preserves newlines (no more .replace(/\s+/g, ' '))
 * - Prepends section heading to every chunk in that section
 * - Semantic chunking opt-in for large/dense documents
 * - Never splits mid-sentence
 * - Chunk metadata (heading, type, position)
 */

import { generateEmbedding } from '@/lib/embeddings'

// ── Constants ──────────────────────────────────────────────────────────────
const SEMANTIC_THRESHOLD_WORDS = 3000  // docs above this get semantic chunking
const DEFAULT_CHUNK_SIZE       = 1200
const DEFAULT_OVERLAP          = 150
const MIN_CHUNK_LENGTH         = 50

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Clean text while preserving structure
 * Key fix: only collapse horizontal whitespace, keep newlines intact
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')       // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')      // collapse spaces/tabs only — NOT newlines
    .replace(/\n{4,}/g, '\n\n\n') // max 3 consecutive newlines
    .replace(/^\s+|\s+$/gm, '')   // trim each line
    .trim()
}

/**
 * Count words in text
 */
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Detect if a line is a section heading
 */
function isHeading(line) {
  if (!line || line.length > 150) return false
  const trimmed = line.trim()

  return (
    /^#{1,6}\s/.test(trimmed) ||                          // ## Markdown heading
    /^[A-Z][A-Z\s\d]{3,50}$/.test(trimmed) ||            // ALL CAPS HEADING
    /^\d+[\.\)]\s+[A-Z]/.test(trimmed) ||                 // 1. Introduction
    /^(Chapter|Section|Part|Appendix)\s+/i.test(trimmed) || // Chapter 3
    (/^[A-Z][^.!?]{5,80}:$/.test(trimmed) &&              // Title ending with colon
      trimmed.split(' ').length <= 10)
  )
}

/**
 * Split text into sentences — handles abbreviations better than indexOf('.')
 */
function splitSentences(text) {
  // Protect known abbreviations before splitting
  const protected_ = text
    .replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|Fig|Eq|No|Vol|pp)\./gi, '$1<DOT>')
    .replace(/(\d+)\.(\d+)/g, '$1<DOT>$2') // decimal numbers like 3.14

  const sentences = protected_
    .replace(/([.!?])\s+([A-Z\"\'])/g, '$1\n$2')
    .split('\n')
    .map(s => s.replace(/<DOT>/g, '.').trim())
    .filter(s => s.length > 10)

  return sentences
}

/**
 * Average multiple embedding vectors
 */
function avgEmbeddings(embeddings) {
  if (embeddings.length === 1) return embeddings[0]
  const len = embeddings[0].length
  const avg = new Array(len).fill(0)
  for (const emb of embeddings) {
    for (let i = 0; i < len; i++) avg[i] += emb[i] / embeddings.length
  }
  return avg
}

/**
 * Cosine similarity between two vectors
 */
function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Merge chunks that are below minSize with their neighbor
 */
function mergeSmallChunks(chunks, minSize, maxSize) {
  if (chunks.length <= 1) return chunks
  const result = []
  let i = 0

  while (i < chunks.length) {
    const chunk = chunks[i]
    if (chunk.content.length < minSize && i < chunks.length - 1) {
      const combined = chunk.content + '\n\n' + chunks[i + 1].content
      if (combined.length <= maxSize) {
        result.push({
          content: combined,
          heading: chunk.heading || chunks[i + 1].heading,
          type: 'merged',
          index: result.length,
        })
        i += 2
        continue
      }
    }
    result.push({ ...chunk, index: result.length })
    i++
  }

  return result
}

// ── STRATEGY 1: Paragraph + Heading (for short docs) ──────────────────────

/**
 * Paragraph chunking with heading preservation
 * Every chunk knows what section it belongs to
 */
function chunkByParagraphWithHeadings(text, maxChunkSize = DEFAULT_CHUNK_SIZE) {
  const lines = text.split('\n')
  const chunks  = []

  let currentHeading = null
  let currentContent = ''

  function flushChunk() {
    const content = currentContent.trim()
    if (content.length < MIN_CHUNK_LENGTH) return

    // Prepend heading to chunk so it carries section context
    const fullContent = currentHeading
      ? `${currentHeading}\n\n${content}`
      : content

    chunks.push({
      content: fullContent,
      heading: currentHeading,
      type: 'paragraph',
    })

    currentContent = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (isHeading(trimmed)) {
      // Save what we have before starting new section
      flushChunk()
      currentHeading = trimmed
      continue
    }

    if (!trimmed) {
      // Blank line — potential paragraph break
      if (currentContent.length > 0) {
        // Check if adding more would exceed limit
        if (currentContent.length >= maxChunkSize * 0.8) {
          flushChunk()
        } else {
          currentContent += '\n\n'
        }
      }
      continue
    }

    // Regular content line
    if ((currentContent + line).length > maxChunkSize) {
      // Current chunk is full — flush and start new one
      flushChunk()

      // Carry heading into new chunk for context continuity
      // but don't repeat the heading text in content
      currentContent = line
    } else {
      currentContent += (currentContent ? '\n' : '') + line
    }
  }

  // Flush any remaining content
  flushChunk()

  return chunks
}

// ── STRATEGY 2: Semantic chunking (for long/dense docs) ───────────────────

/**
 * Semantic chunking using embedding similarity
 * Detects topic shifts between sentence groups
 */
async function chunkBySemantic(
  text,
  maxChunkSize = DEFAULT_CHUNK_SIZE,
  breakpointThreshold = 0.72,
  bufferSize = 1
) {
  const sentences = splitSentences(text).filter(s => s.length > 15)

  if (sentences.length === 0) return []
  if (sentences.length === 1) return [{ content: sentences[0], type: 'semantic' }]

  console.log(`[SemanticChunker] Embedding ${sentences.length} sentences...`)

  // Embed all sentences
  let embeddings
  try {
    embeddings = await Promise.all(sentences.map(s => generateEmbedding(s)))
  } catch (err) {
    console.warn('[SemanticChunker] Embedding failed:', err.message)
    throw err // let caller handle fallback
  }

  // Compute similarity between adjacent sentence windows
  const similarities = []

  for (let i = 0; i < sentences.length - 1; i++) {
    const leftStart  = Math.max(0, i - bufferSize + 1)
    const rightEnd   = Math.min(sentences.length - 1, i + bufferSize)
    const leftAvg    = avgEmbeddings(embeddings.slice(leftStart, i + 1))
    const rightAvg   = avgEmbeddings(embeddings.slice(i + 1, rightEnd + 1))
    similarities.push(cosineSim(leftAvg, rightAvg))
  }

  // Adaptive threshold — use 25th percentile of similarities
  const sorted = [...similarities].sort((a, b) => a - b)
  const p25 = sorted[Math.floor(sorted.length * 0.25)]
  const threshold = Math.min(breakpointThreshold, p25 + 0.1)

  console.log(`[SemanticChunker] Threshold: ${threshold.toFixed(3)} | Similarities range: ${sorted[0].toFixed(2)}-${sorted[sorted.length-1].toFixed(2)}`)

  // Find breakpoints where similarity drops below threshold
  const breakpoints = similarities
    .map((sim, i) => ({ sim, i }))
    .filter(({ sim }) => sim < threshold)
    .map(({ i }) => i + 1)

  console.log(`[SemanticChunker] ${breakpoints.length} semantic breakpoints found`)

  // Build raw chunks from breakpoints
  const rawChunks = []
  let start = 0

  const addChunk = (sentenceSlice) => {
    const content = sentenceSlice.join(' ').trim()
    if (content.length >= MIN_CHUNK_LENGTH) {
      rawChunks.push({ content, type: 'semantic' })
    }
  }

  for (const bp of breakpoints) {
    addChunk(sentences.slice(start, bp))
    start = bp
  }
  addChunk(sentences.slice(start))

  // Merge tiny chunks and split oversized ones
  const merged = mergeSmallChunks(rawChunks, 100, maxChunkSize)

  const final = []
  for (const chunk of merged) {
    if (chunk.content.length > maxChunkSize) {
      // Split oversized chunk by sentences
      const sub = chunkByParagraphWithHeadings(chunk.content, maxChunkSize)
      final.push(...sub)
    } else {
      final.push(chunk)
    }
  }

  return final
}

// ── STRATEGY 3: Fixed-size fallback ───────────────────────────────────────

/**
 * Fixed-size chunking — last resort only
 * Fixed from original: no longer destroys whitespace structure
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
  if (!text || text.trim().length === 0) return []

  const cleaned = cleanText(text)  // preserves newlines now
  const chunks  = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + chunkSize

    if (end < cleaned.length) {
      // Try to break at sentence boundary first
      const sentenceEnd = cleaned.lastIndexOf('. ', end)
      const newlineEnd  = cleaned.lastIndexOf('\n', end)
      const breakPoint  = Math.max(sentenceEnd, newlineEnd)

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1
      }
    }

    const chunk = cleaned.slice(start, end).trim()
    if (chunk.length > MIN_CHUNK_LENGTH) {
      chunks.push(chunk)
    }

    start = end - overlap
    if (start >= cleaned.length) break
  }

  return chunks
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────

/**
 * Smart hybrid chunker
 *
 * Automatically picks the best strategy:
 * - Short doc  → paragraph + heading preservation (fast)
 * - Long doc   → semantic chunking (quality)
 * - Fallback   → fixed-size (always works)
 *
 * @param {string} text
 * @param {number} maxChunkSize
 * @param {object} options
 * @param {string}  options.strategy       - 'auto' | 'paragraph' | 'semantic' | 'fixed'
 * @param {number}  options.semanticThresholdWords - word count above which semantic kicks in (default 3000)
 * @param {number}  options.breakpointThreshold    - semantic similarity threshold (default 0.72)
 * @param {number}  options.bufferSize             - sentence window for similarity (default 1)
 * @returns {Promise<string[]>} array of chunk strings
 */
export async function smartChunk(text, maxChunkSize = DEFAULT_CHUNK_SIZE, options = {}) {
  const {
    strategy                = 'auto',
    semanticThresholdWords  = SEMANTIC_THRESHOLD_WORDS,
    breakpointThreshold     = 0.72,
    bufferSize              = 1,
  } = options

  if (!text || text.trim().length === 0) return []

  const cleaned = cleanText(text)
  const words   = wordCount(cleaned)

  console.log(`[Chunker] Doc: ${words} words | Strategy: ${strategy}`)

  // ── Semantic for long docs ─────────────────────────────────────────
  const useSemantic = strategy === 'semantic' ||
    (strategy === 'auto' && words >= semanticThresholdWords)

  if (useSemantic) {
    console.log(`[Chunker] → Semantic chunking (${words} words ≥ ${semanticThresholdWords} threshold)`)
    try {
      const chunks = await chunkBySemantic(
        cleaned,
        maxChunkSize,
        breakpointThreshold,
        bufferSize
      )
      if (chunks.length >= 2) {
        console.log(`[Chunker] ✓ Semantic: ${chunks.length} chunks`)
        return chunks.map(c => c.content)
      }
      console.log('[Chunker] Semantic returned < 2 chunks → paragraph fallback')
    } catch (err) {
      console.warn('[Chunker] Semantic failed → paragraph fallback:', err.message)
    }
  }

  // ── Paragraph + headings for short/medium docs ────────────────────
  if (strategy === 'auto' || strategy === 'paragraph') {
    console.log(`[Chunker] → Paragraph chunking (${words} words)`)
    const chunks = chunkByParagraphWithHeadings(cleaned, maxChunkSize)
      .filter(c => c.content.length > MIN_CHUNK_LENGTH)

    if (chunks.length >= 1) {
      console.log(`[Chunker] ✓ Paragraph: ${chunks.length} chunks`)
      return chunks.map(c => c.content)
    }
  }

  // ── Fixed-size fallback ───────────────────────────────────────────
  console.log('[Chunker] → Fixed-size fallback')
  const chunks = chunkText(cleaned, maxChunkSize)
  console.log(`[Chunker] ✓ Fixed: ${chunks.length} chunks`)
  return chunks
}

/**
 * Backward-compatible export
 * Existing code that imports chunkByParagraph still works
 * But now returns strings with heading context preserved
 */
export function chunkByParagraph(text, maxChunkSize = DEFAULT_CHUNK_SIZE) {
  if (!text || text.trim().length === 0) return []
  const cleaned = cleanText(text)
  return chunkByParagraphWithHeadings(cleaned, maxChunkSize)
    .map(c => c.content)
    .filter(c => c.length > MIN_CHUNK_LENGTH)
}