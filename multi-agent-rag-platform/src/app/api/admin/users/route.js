import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ users: profiles })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}