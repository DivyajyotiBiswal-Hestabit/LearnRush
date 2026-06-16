import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { HistoryClient } from '@/components/history/HistoryClient'
export const metadata = { title: 'History' }
export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: queries } = await supabase
    .from('queries')
    .select(`
      *,
      chat_sessions(id, title),
      teams(id, name, collaboration_mode)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <HistoryClient initialQueries={queries ?? []} />
    </AppLayout>
  )
}