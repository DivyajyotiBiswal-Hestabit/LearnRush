import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: query, error } = await supabase
      .from('queries')
      .select(`
        *,
        chat_sessions(id, title),
        teams(id, name, collaboration_mode, agents(*)),
        agent_traces(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !query) {
      return Response.json({ error: 'Query not found' }, { status: 404 })
    }

    // Sort traces by step_index
    if (query.agent_traces) {
      query.agent_traces.sort((a, b) => (a.step_index ?? 0) - (b.step_index ?? 0))
    }

    return Response.json({ query })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch query' }, { status: 500 })
  }
}