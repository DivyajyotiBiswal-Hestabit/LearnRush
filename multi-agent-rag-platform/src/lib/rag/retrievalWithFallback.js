import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { rewriteQuery } from '@/lib/rag/queryRewriter'
import { keywordSearch, globalKeywordSearch } from '@/lib/rag/keywordSearch'
import { generateEmbedding } from '@/lib/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Retrieval result with metadata about which method succeeded
 */
function makeResult(chunks, method, query, rewrites = []) {
  return {
    chunks,
    method,           // which method found results
    originalQuery: query,
    rewrites,         // what rewrites were tried
    isEmpty: chunks.length === 0,
  }
}

/**
 * Full retrieval pipeline with graceful fallbacks
 *
 * Level 1: Hybrid search (vector + BM25) on original query
 * Level 2: Query rewriting → retry hybrid search with each rewrite
 * Level 3: Pure keyword search (no vectors)
 * Level 4: ILIKE loose matching
 * Level 5: Graceful empty — honest "no info found" message
 */
export async function retrieveWithFallback({
  query,
  knowledgeBaseId,
  userId = null,
  topK = 5,
  threshold = 0.3,
  options = {},
}) {
  console.log(`[RAG] Starting retrieval for: "${query.slice(0, 60)}..."`)

  // ── Level 1: Standard hybrid retrieval ──────────────────────────────
  console.log('[RAG] Level 1: Hybrid search...')
  try {
    const chunks = await retrieveRelevantChunks(
      query,
      knowledgeBaseId,
      topK,
      threshold,
      options
    )

    if (chunks.length > 0) {
      console.log(`[RAG] Level 1 success: ${chunks.length} chunks found`)
      return makeResult(chunks, 'hybrid', query)
    }
  } catch (err) {
    console.warn('[RAG] Level 1 failed:', err.message)
  }

  console.log('[RAG] Level 1 empty — trying query rewriting...')

  // ── Level 2: Query rewriting ─────────────────────────────────────────
  let rewrites = []
  try {
    rewrites = await rewriteQuery(query)
    console.log('[RAG] Rewrites generated:', rewrites)

    for (const rewrite of rewrites) {
      if (!rewrite?.trim()) continue

      console.log(`[RAG] Level 2: Trying rewrite: "${rewrite}"`)

      try {
        const chunks = await retrieveRelevantChunks(
          rewrite,
          knowledgeBaseId,
          topK,
          threshold * 0.8, // slightly lower threshold for rewrites
          options
        )

        if (chunks.length > 0) {
          console.log(`[RAG] Level 2 success with rewrite: "${rewrite}" — ${chunks.length} chunks`)
          return makeResult(chunks, 'rewritten', query, rewrites)
        }
      } catch (err) {
        console.warn(`[RAG] Level 2 rewrite failed for "${rewrite}":`, err.message)
      }
    }
  } catch (err) {
    console.warn('[RAG] Query rewriting failed:', err.message)
  }

  console.log('[RAG] Level 2 empty — trying keyword search...')

  // ── Level 3: Keyword-only search ─────────────────────────────────────
  try {
    const chunks = await keywordSearch(query, knowledgeBaseId, topK)

    if (chunks.length > 0) {
      console.log(`[RAG] Level 3 keyword success: ${chunks.length} chunks`)
      return makeResult(chunks, 'keyword', query, rewrites)
    }
  } catch (err) {
    console.warn('[RAG] Level 3 keyword search failed:', err.message)
  }

  // Also try keywords from rewrites
  for (const rewrite of rewrites) {
    try {
      const chunks = await keywordSearch(rewrite, knowledgeBaseId, topK)
      if (chunks.length > 0) {
        console.log(`[RAG] Level 3 keyword success with rewrite: ${chunks.length} chunks`)
        return makeResult(chunks, 'keyword_rewrite', query, rewrites)
      }
    } catch {
      // continue
    }
  }

  console.log('[RAG] Level 3 empty — trying global search...')

  // ── Level 4: Search across all KBs for this user ─────────────────────
  if (userId) {
    try {
      const chunks = await globalKeywordSearch(query, userId, 3)

      if (chunks.length > 0) {
        console.log(`[RAG] Level 4 global search: ${chunks.length} chunks from other KBs`)
        return makeResult(chunks, 'global_keyword', query, rewrites)
      }
    } catch (err) {
      console.warn('[RAG] Level 4 global search failed:', err.message)
    }
  }

  // ── Level 5: Graceful empty ───────────────────────────────────────────
  console.log('[RAG] All retrieval methods exhausted — returning graceful empty')
  return makeResult([], 'none', query, rewrites)
}

/**
 * Format the retrieval result into context string for agents
 * Includes a note about HOW the context was found
 */
export function formatRetrievalResult(result) {
  if (result.isEmpty) {
    return {
      context: null,
      isEmpty: true,
      message: buildEmptyMessage(result),
    }
  }

  const methodLabels = {
    hybrid:           'hybrid vector + keyword search',
    rewritten:        'query rewriting + hybrid search',
    keyword:          'keyword matching',
    keyword_rewrite:  'keyword matching on rewritten query',
    global_keyword:   'search across all knowledge bases',
  }

  const methodLabel = methodLabels[result.method] ?? result.method

  let context = ''

  if (result.method !== 'hybrid') {
    context += `[Note: Retrieved using ${methodLabel} — results may be less precise]\n\n`
  }

  context += result.chunks
    .map((chunk, i) => {
      const score = chunk.hybrid_score ?? chunk.similarity ?? 0
      const method = chunk.search_method ? ` | method: ${chunk.search_method}` : ''
      const source = chunk.metadata?.file_name ? ` | source: ${chunk.metadata.file_name}` : ''
      return `[Source ${i + 1} | relevance: ${(score * 100).toFixed(0)}%${method}${source}]\n${chunk.content}`
    })
    .join('\n\n---\n\n')

  return {
    context,
    isEmpty: false,
    method: result.method,
    rewrites: result.rewrites,
  }
}

/**
 * Build a helpful empty message when nothing was found
 */
function buildEmptyMessage(result) {
  const lines = [
    '⚠️ No relevant information was found in the knowledge base.',
    '',
    'Retrieval methods attempted:',
    '  ✗ Hybrid vector + keyword search (original query)',
  ]

  if (result.rewrites?.length > 0) {
    lines.push(`  ✗ Query rewriting (tried ${result.rewrites.length} variations)`)
    result.rewrites.forEach(r => lines.push(`      → "${r}"`))
  }

  lines.push('  ✗ Keyword matching (full-text search)')
  lines.push('  ✗ Loose keyword matching (ILIKE)')
  lines.push('')
  lines.push('Possible reasons:')
  lines.push('  • The knowledge base may not contain information about this topic')
  lines.push('  • Try uploading more relevant documents')
  lines.push('  • Rephrase the question using different terminology')

  return lines.join('\n')
}