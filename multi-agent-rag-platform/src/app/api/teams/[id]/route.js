import { createClient } from '@/lib/supabase/server'
import { getTeamById, updateTeam, deleteTeam } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const team = await getTeamById(params.id)
    if (!team || team.user_id !== user.id) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    return Response.json({ team })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description, research_domain, collaboration_mode, agents } = body

    // Update team details
    const team = await updateTeam(params.id, {
      name: name?.trim(),
      description: description?.trim(),
      research_domain: research_domain?.trim(),
      collaboration_mode,
    })

    // If agents provided, replace them all
    if (agents) {
      const supabaseClient = await createClient()

      // Delete existing agents
      await supabaseClient
        .from('agents')
        .delete()
        .eq('team_id', params.id)

      // Insert new agents
      const agentRows = agents.map((agent, index) => ({
        team_id: params.id,
        user_id: user.id,
        name: agent.name,
        role: agent.role,
        description: agent.description ?? '',
        model_id: agent.model_id,
        system_prompt: agent.system_prompt ?? '',
        response_style: agent.response_style ?? 'balanced',
        order_index: index,
      }))

      await supabaseClient.from('agents').insert(agentRows)
    }

    // Return full updated team
    const supabaseClient = await createClient()
    const { data: fullTeam } = await supabaseClient
      .from('teams')
      .select('*, agents(*)')
      .eq('id', params.id)
      .single()

    return Response.json({ team: fullTeam })
  } catch (error) {
    console.error('PUT /api/teams/[id] error:', error)
    return Response.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await deleteTeam(params.id)
    return Response.json({ message: 'Team deleted successfully' })
  } catch (error) {
    return Response.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}