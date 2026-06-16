import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        teams(name, collaboration_mode),
        knowledge_bases(name),
        queries(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return Response.json({ sessions: sessions ?? [] })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}