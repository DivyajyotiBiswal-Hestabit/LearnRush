import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { EnhancedProfileClient } from '@/components/profile/EnhancedProfileClient'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sync usage and fetch profile
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
      <EnhancedProfileClient
        profile={{ ...profile, email: user.email }}
      />
    </AppLayout>
  )
}