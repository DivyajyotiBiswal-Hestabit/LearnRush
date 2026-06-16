import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: kbs, error } = await supabase
      .from('knowledge_bases')
      .select(`*, documents(id, file_name, status, file_type, created_at)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ knowledgeBases: kbs })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description, team_id } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() ?? '',
        team_id: team_id ?? null,
        embedding_model: 'nomic-embed-text',
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ knowledgeBase: kb }, { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Failed to create knowledge base' }, { status: 500 })
  }
}