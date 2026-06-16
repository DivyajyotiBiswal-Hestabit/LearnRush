import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Delete all user storage files
    const { data: docFiles } = await admin
      .storage
      .from('documents')
      .list(user.id)

    if (docFiles?.length) {
      const paths = docFiles.map(f => `${user.id}/${f.name}`)
      await admin.storage.from('documents').remove(paths)
    }

    // Delete avatar
    await admin.storage.from('avatars').remove([
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
    ])

    // Delete auth user (cascades to all DB rows via foreign keys)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return Response.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Account deletion error:', error)
    return Response.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}