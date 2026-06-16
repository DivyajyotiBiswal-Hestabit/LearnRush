import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addManualMemory } from '@/lib/agents/memory'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: memories } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })

    return Response.json({ memories: memories ?? [] })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, memory_type, importance } = await request.json()

    if (!content?.trim()) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    const memory = await addManualMemory(
      user.id, id, content.trim(),
      memory_type ?? 'fact',
      importance ?? 5
    )

    return Response.json({ memory }, { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Failed to add memory' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memoryId = searchParams.get('memoryId')

    if (!memoryId) {
      // Clear all memories for this team
      await supabase
        .from('agent_memory')
        .update({ is_active: false })
        .eq('team_id', id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('agent_memory')
        .update({ is_active: false })
        .eq('id', memoryId)
        .eq('user_id', user.id)
    }

    return Response.json({ message: 'Memory deleted' })
  } catch (error) {
    return Response.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}