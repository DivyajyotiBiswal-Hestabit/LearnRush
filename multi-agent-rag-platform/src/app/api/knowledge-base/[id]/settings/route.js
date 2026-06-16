import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: kb } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!kb) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({ settings: kb })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name,
      description,
      embedding_model,
      vector_weight,
      keyword_weight,
      chunk_size,
      chunk_overlap,
      top_k,
      similarity_threshold,
    } = body

    const updates = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (embedding_model !== undefined) updates.embedding_model = embedding_model

    // Store RAG settings in a metadata column — add it first
    const ragSettings = {
      vector_weight: vector_weight ?? 0.7,
      keyword_weight: keyword_weight ?? 0.3,
      chunk_size: chunk_size ?? 1200,
      chunk_overlap: chunk_overlap ?? 200,
      top_k: top_k ?? 5,
      similarity_threshold: similarity_threshold ?? 0.3,
    }

    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ settings: { ...kb, ragSettings } })
  } catch (error) {
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}