import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const sessionId = searchParams.get('sessionId')

    let query = supabase
      .from('queries')
      .select(`
        *,
        chat_sessions(id, title),
        teams(id, name, collaboration_mode)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: queries, error } = await query
    if (error) throw error

    return Response.json({ queries: queries ?? [] })
  } catch (error) {
    console.error('GET /api/history error:', error)
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}