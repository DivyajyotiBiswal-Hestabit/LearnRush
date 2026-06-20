import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [teamsRes, queriesRes, docsRes, sessionsRes] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('queries').select('id, quality_score, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('chat_sessions').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  const data = {
    teamCount: teamsRes.count ?? 0,
    queryCount: queriesRes.count ?? 0,
    docCount: docsRes.count ?? 0,
    sessionCount: sessionsRes.count ?? 0,
    recentQueries: queriesRes.data ?? [],
    firstName: (profile?.full_name ?? user.user_metadata?.full_name ?? 'Researcher').split(' ')[0],
  }

  return (
    <AppLayout user={appUser}>
      <DashboardClient data={data} />
    </AppLayout>
  )
}