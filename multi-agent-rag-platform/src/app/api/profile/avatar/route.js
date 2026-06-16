import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('avatar')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({
        error: 'Only JPEG, PNG, WEBP and GIF allowed'
      }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'Max 5MB allowed' }, { status: 400 })
    }

    const admin = createAdminClient()
    const ext = file.type.split('/')[1]
    const storagePath = `${user.id}/avatar.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Remove old avatar first
    await admin.storage.from('avatars').remove([storagePath])

    // Upload new avatar
    const { error: uploadError } = await admin
      .storage
      .from('avatars')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = admin
      .storage
      .from('avatars')
      .getPublicUrl(storagePath)

    // Update profile
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    return Response.json({ avatarUrl: publicUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}