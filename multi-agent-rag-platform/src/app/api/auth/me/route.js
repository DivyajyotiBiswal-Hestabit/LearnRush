import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch profile from DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name ?? user.user_metadata?.full_name,
        avatarUrl: profile?.avatar_url ?? null,
        createdAt: profile?.created_at ?? user.created_at,
      },
    })
  } catch (error) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}