import { createClient } from '@/lib/supabase/server'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { query, knowledgeBaseId, options = {} } = await request.json()

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!knowledgeBaseId) {
      return Response.json({ error: 'knowledgeBaseId is required' }, { status: 400 })
    }

    const chunks = await retrieveRelevantChunks(
      query,
      knowledgeBaseId,
      options.topK ?? 8,
      options.threshold ?? 0.2,
      {
        useLLMRerank: options.useLLMRerank ?? false,
        vectorWeight: options.vectorWeight ?? 0.7,
        keywordWeight: options.keywordWeight ?? 0.3,
      }
    )

    return Response.json({ chunks, count: chunks.length })
  } catch (error) {
    console.error('Test retrieval error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}