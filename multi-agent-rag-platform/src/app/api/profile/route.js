import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Sync usage counts first
    const admin = createAdminClient()
    await admin.rpc('sync_user_usage_counts', { p_user_id: user.id })

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return Response.json({ profile })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { full_name, bio, avatar_url } = body

    const updates = {
      updated_at: new Date().toISOString(),
    }

    if (full_name !== undefined) updates.full_name = full_name.trim()
    if (bio !== undefined) updates.bio = bio.trim()
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ profile })
  } catch (error) {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}