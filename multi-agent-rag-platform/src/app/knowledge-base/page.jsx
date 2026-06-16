import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { KnowledgeBaseClient } from '@/components/knowledge-base/KnowledgeBaseClient'
export const metadata = { title: 'Knowledge Base' }
export default async function KnowledgeBasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: kbs } = await supabase
    .from('knowledge_bases')
    .select(`*, documents(id, file_name, file_type, status, chunk_count, created_at)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <KnowledgeBaseClient
        initialKBs={kbs ?? []}
        teams={teams ?? []}
      />
    </AppLayout>
  )
}