import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return Response.json({ message: 'Logged out successfully' })
  } catch (error) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}