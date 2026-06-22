import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get document details
    const { data: doc } = await admin
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    if (doc.storage_path) {
      await admin.storage
        .from('documents')
        .remove([doc.storage_path])
    }

    // Delete document record (chunks cascade automatically)
    await admin
      .from('documents')
      .delete()
      .eq('id', id)

    return Response.json({ message: 'Document deleted' })
  } catch (error) {
    console.error('Delete document error:', error)

    return Response.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}