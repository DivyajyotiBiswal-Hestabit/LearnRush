import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChatClient } from '@/components/chat/ChatClient'
export const metadata = { title: 'Research Chat' }
export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [teamsRes, kbsRes] = await Promise.all([
    supabase
      .from('teams')
      .select('*, agents(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('knowledge_bases')
      .select('id, name, document_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <ChatClient
        teams={teamsRes.data ?? []}
        knowledgeBases={kbsRes.data ?? []}
      />
    </AppLayout>
  )
}