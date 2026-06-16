import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: docs } = await admin
      .from('documents')
      .select('storage_path')
      .eq('knowledge_base_id', id)

    if (docs?.length) {
      const paths = docs.map(d => d.storage_path).filter(Boolean)
      if (paths.length) {
        await admin.storage.from('documents').remove(paths)
      }
    }

    const { error } = await admin
      .from('knowledge_bases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return Response.json({ message: 'Knowledge base deleted' })
  } catch (error) {
    return Response.json({ error: 'Failed to delete knowledge base' }, { status: 500 })
  }
}