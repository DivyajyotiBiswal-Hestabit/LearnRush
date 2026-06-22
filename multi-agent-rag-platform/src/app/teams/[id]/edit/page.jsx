import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { TeamForm } from '@/components/teams/TeamForm'
import { notFound } from 'next/navigation'

export default async function EditTeamPage({ params }) {
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

  // Sort agents by order_index
  team.agents = team.agents?.sort((a, b) => a.order_index - b.order_index)

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
  }

  return (
    <AppLayout user={appUser}>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#004225]">Edit Team</h1>
          <p className="text-[#004225] text-sm mt-1">
            Update your team configuration and agent settings
          </p>
        </div>
        <TeamForm initialData={team} />
      </div>
    </AppLayout>
  )
}