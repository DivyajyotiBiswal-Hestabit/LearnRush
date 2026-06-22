import { createAdminClient } from '@/lib/supabase/admin'
import { extractKeywords } from '@/lib/rag/queryRewriter'

/**
 * Pure keyword search using Postgres full-text search
 * No vectors needed — works even if embeddings failed
 */
export async function keywordSearch(query, knowledgeBaseId, limit = 5) {
  const admin = createAdminClient()
  const keywords = extractKeywords(query)

  if (keywords.length === 0) return []

  try {
    // Try full-text search using tsv_content column
    const tsQuery = keywords.join(' | ') // OR between keywords

    const { data: chunks, error } = await admin
      .from('document_chunks')
      .select('id, document_id, knowledge_base_id, content, metadata, chunk_index, chunk_type')
      .eq('knowledge_base_id', knowledgeBaseId)
      .textSearch('tsv_content', tsQuery, {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit)

    if (error) throw error

    if (chunks && chunks.length > 0) {
      // Add a fake similarity score so it fits the same shape as vector results
      return chunks.map(chunk => ({
        ...chunk,
        similarity: 0.3,
        hybrid_score: 0.3,
        vector_score: 0,
        keyword_score: 1,
        search_method: 'keyword_fts',
      }))
    }

    // Fallback to ILIKE if full-text search returns nothing
    return await ilikeSearch(keywords, knowledgeBaseId, limit, admin)
  } catch (err) {
    console.warn('Full-text search failed, trying ILIKE:', err.message)
    return await ilikeSearch(keywords, knowledgeBaseId, limit, admin)
  }
}

/**
 * ILIKE-based search — slowest but most permissive fallback
 */
async function ilikeSearch(keywords, knowledgeBaseId, limit, admin) {
  try {
    // Search for any chunk containing at least one keyword
    const { data: chunks, error } = await admin
      .from('document_chunks')
      .select('id, document_id, knowledge_base_id, content, metadata, chunk_index, chunk_type')
      .eq('knowledge_base_id', knowledgeBaseId)
      .or(keywords.map(kw => `content.ilike.%${kw}%`).join(','))
      .limit(limit)

    if (error) throw error

    if (!chunks || chunks.length === 0) return []

    // Score by how many keywords appear in the chunk
    const scored = chunks.map(chunk => {
      const contentLower = chunk.content.toLowerCase()
      const matchCount = keywords.filter(kw => contentLower.includes(kw)).length
      const score = matchCount / keywords.length

      return {
        ...chunk,
        similarity: score * 0.25,
        hybrid_score: score * 0.25,
        vector_score: 0,
        keyword_score: score,
        search_method: 'ilike',
      }
    })

    return scored
      .filter(c => c.keyword_score > 0)
      .sort((a, b) => b.keyword_score - a.keyword_score)
  } catch (err) {
    console.error('ILIKE search failed:', err.message)
    return []
  }
}

/**
 * Search across ALL knowledge bases as a last resort
 * when the specific KB returns nothing
 */
export async function globalKeywordSearch(query, userId, limit = 3) {
  const admin = createAdminClient()
  const keywords = extractKeywords(query)

  if (keywords.length === 0) return []

  try {
    const { data: chunks } = await admin
      .from('document_chunks')
      .select('id, document_id, knowledge_base_id, content, metadata, chunk_index, chunk_type')
      .eq('user_id', userId)
      .or(keywords.map(kw => `content.ilike.%${kw}%`).join(','))
      .limit(limit)

    return (chunks ?? []).map(chunk => ({
      ...chunk,
      similarity: 0.2,
      hybrid_score: 0.2,
      search_method: 'global_keyword',
    }))
  } catch {
    return []
  }
}