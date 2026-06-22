import { generateEmbedding } from '@/lib/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'
import { rankChunksByBM25 } from '@/lib/rag/bm25'
import { lexicalRerank, llmRerank } from '@/lib/rag/reranker'

/**
 * Standard vector-only retrieval (Phase 5 method — kept for fallback)
 */
export async function retrieveByVector(
  query,
  knowledgeBaseId,
  topK = 5,
  threshold = 0.4
) {
  const queryEmbedding = await generateEmbedding(query)
  const admin = createAdminClient()

  const { data: chunks, error } = await admin.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter_knowledge_base_id: knowledgeBaseId,
  })

  if (error) throw new Error(`Vector retrieval failed: ${error.message}`)
  return chunks ?? []
}

/**
 * Hybrid retrieval — combines vector + BM25 keyword search
 * Uses the hybrid_search_chunks SQL function
 */
export async function retrieveHybrid(
  query,
  knowledgeBaseId,
  topK = 8,
  vectorWeight = 0.7,
  keywordWeight = 0.3
) {
  const queryEmbedding = await generateEmbedding(query)
  const admin = createAdminClient()

  const { data: chunks, error } = await admin.rpc('hybrid_search_chunks', {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: topK * 2, // over-fetch for reranking
    vector_weight: vectorWeight,
    keyword_weight: keywordWeight,
    filter_knowledge_base_id: knowledgeBaseId,
  })

  if (error) {
    console.warn('Hybrid search failed, falling back to vector:', error.message)
    return retrieveByVector(query, knowledgeBaseId, topK)
  }

  return chunks ?? []
}

/**
 * Full enhanced retrieval pipeline:
 * 1. Hybrid search (vector + BM25)
 * 2. Lexical reranking
 * 3. Optional LLM reranking (for top candidates)
 * 4. Return top K
 */
export async function retrieveRelevantChunks(
  query,
  knowledgeBaseId,
  topK = 5,
  threshold = 0.3,
  options = {}
) {
  const {
    useLLMRerank = false,
    rerankModel = 'phi3:latest',
    vectorWeight = 0.7,
    keywordWeight = 0.3,
  } = options

  try {
    // Step 1: Hybrid retrieval
    let chunks = await retrieveHybrid(
      query,
      knowledgeBaseId,
      topK * 3,
      vectorWeight,
      keywordWeight
    )

    if (chunks.length === 0) return []

    // Step 2: Lexical reranking
    chunks = lexicalRerank(query, chunks)

    // Step 3: LLM reranking (optional, slower)
    if (useLLMRerank && chunks.length > topK) {
      chunks = await llmRerank(query, chunks, rerankModel, topK)
    } else {
      chunks = chunks.slice(0, topK)
    }

    // Step 4: Filter by threshold
    return chunks.filter(c =>
      (c.hybrid_score ?? c.vector_score ?? c.similarity ?? 0) >= threshold
    )
  } catch (error) {
    console.error('Enhanced retrieval error:', error)
    // Final fallback to basic vector search
    return retrieveByVector(query, knowledgeBaseId, topK, threshold)
  }
}

/**
 * Format retrieved chunks into a context string for LLM prompts
 */
export function formatChunksAsContext(chunks) {
  if (!chunks || chunks.length === 0) {
    return 'No relevant documents found in the knowledge base.'
  }

  return chunks
    .map((chunk, index) => {
      const score = chunk.hybrid_score ?? chunk.vector_score ?? chunk.similarity ?? 0
      const scorePct = (score * 100).toFixed(0)
      const type = chunk.chunk_type ? ` | Type: ${chunk.chunk_type}` : ''
      const source = chunk.metadata?.file_name ? ` | Source: ${chunk.metadata.file_name}` : ''

      return `[Source ${index + 1} | Relevance: ${scorePct}%${type}${source}]\n${chunk.content}`
    })
    .join('\n\n---\n\n')
}

/**
 * Retrieve chunks and group by source document
 * Useful for citation tracking
 */
export async function retrieveWithCitations(
  query,
  knowledgeBaseId,
  topK = 5
) {
  const chunks = await retrieveRelevantChunks(query, knowledgeBaseId, topK)

  const byDocument = {}
  chunks.forEach(chunk => {
    const docId = chunk.document_id
    if (!byDocument[docId]) {
      byDocument[docId] = {
        documentId: docId,
        fileName: chunk.metadata?.file_name ?? 'Unknown',
        chunks: [],
        maxScore: 0,
      }
    }
    byDocument[docId].chunks.push(chunk)
    byDocument[docId].maxScore = Math.max(
      byDocument[docId].maxScore,
      chunk.hybrid_score ?? chunk.vector_score ?? 0
    )
  })

  return {
    chunks,
    citations: Object.values(byDocument).sort((a, b) => b.maxScore - a.maxScore),
  }
}