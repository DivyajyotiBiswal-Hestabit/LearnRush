import { createClient } from '@/lib/supabase/server'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { question, knowledgeBaseId } = await request.json()

    if (!knowledgeBaseId || !question) {
      return Response.json({ chunks: [] })
    }

    const chunks = await retrieveRelevantChunks(
      question,
      knowledgeBaseId,
      8,
      0.2
    )

    return Response.json({ chunks })
  } catch (error) {
    console.error('Sources fetch error:', error)
    return Response.json({ chunks: [] })
  }
}