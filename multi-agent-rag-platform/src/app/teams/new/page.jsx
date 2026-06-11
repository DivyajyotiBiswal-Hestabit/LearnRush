import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { TeamForm } from '@/components/teams/TeamForm'

export default async function NewTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
  }

  return (
    <AppLayout user={appUser}>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Agent Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define your agents, assign models, and set how they collaborate
          </p>
        </div>
        <TeamForm />
      </div>
    </AppLayout>
  )
}