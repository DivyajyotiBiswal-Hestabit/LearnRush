import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    const knowledgeBaseId = formData.get('knowledgeBaseId')

    if (!file || !knowledgeBaseId) {
      return Response.json({ error: 'File and knowledgeBaseId are required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ]
    if (!allowedTypes.includes(file.type)) {
      return Response.json({
        error: 'Unsupported file type. Allowed: PDF, TXT, PNG, JPG, WEBP'
      }, { status: 400 })
    }

    // Validate file size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File too large. Max 20MB.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Build storage path: userId/knowledgeBaseId/timestamp-filename
    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${knowledgeBaseId}/${timestamp}-${cleanName}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin
      .storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Create document record in DB
    const { data: document, error: dbError } = await admin
      .from('documents')
      .insert({
        knowledge_base_id: knowledgeBaseId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return Response.json({ error: 'Failed to record document' }, { status: 500 })
    }

    return Response.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Upload failed', details: error.message }, { status: 500 })
  }
}