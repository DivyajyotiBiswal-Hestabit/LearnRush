import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { TemplatesClient } from '@/components/templates/TemplatesClient'

export const metadata = { title: 'Templates' }

export default async function TemplatesPage() {
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
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <TemplatesClient />
    </AppLayout>
  )
}