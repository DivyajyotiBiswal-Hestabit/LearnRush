import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdvancedConfigClient } from '@/components/agents/AdvancedConfigClient'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Advanced Config' }

export default async function AdvancedConfigPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: team } = await supabase
    .from('teams')
    .select('*, agents(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!team) notFound()

  team.agents = team.agents?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <AdvancedConfigClient team={team} />
    </AppLayout>
  )
}