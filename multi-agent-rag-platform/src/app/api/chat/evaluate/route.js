import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateRAG } from '@/lib/evaluation/ragEvaluator'
import { formatChunksAsContext } from '@/lib/rag/retriever'

export const maxDuration = 120

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { queryId } = await request.json()
    if (!queryId) {
      return Response.json({ error: 'queryId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch query with traces and citations
    const { data: query, error } = await admin
      .from('queries')
      .select(`*, agent_traces(*), citations(*)`)
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single()

    if (error || !query) {
      return Response.json({ error: 'Query not found' }, { status: 404 })
    }

    if (!query.final_answer) {
      return Response.json({ error: 'Query has no answer to evaluate' }, { status: 400 })
    }

    // Fetch the actual chunks used
    let chunks = []
    if (query.citations?.length > 0) {
      const chunkIds = query.citations
        .map(c => c.chunk_id)
        .filter(Boolean)

      if (chunkIds.length > 0) {
        const { data: chunkData } = await admin
          .from('document_chunks')
          .select('id, content, metadata, chunk_type')
          .in('id', chunkIds)

        chunks = chunkData ?? []
      }
    }

    // Build context string from chunks
    const context = chunks.length > 0
      ? formatChunksAsContext(chunks.map(c => ({
          ...c,
          hybrid_score: query.citations?.find(ci => ci.chunk_id === c.id)?.relevance_score ?? 0.5,
        })))
      : 'No context retrieved'

    // Run evaluation
    const evaluation = await evaluateRAG({
      question: query.question,
      answer: query.final_answer,
      context,
      chunks,
    })

    // Save evaluation results to DB
    await admin
      .from('queries')
      .update({
        evaluation_metrics: evaluation,
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', queryId)

    return Response.json({ evaluation })
  } catch (error) {
    console.error('Evaluation error:', error)
    return Response.json({ error: 'Evaluation failed', details: error.message }, { status: 500 })
  }
}