import { createClient } from '@/lib/supabase/server'
import { createTeam, getTeams } from '@/lib/db'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const teams = await getTeams(user.id)
    return Response.json({ teams })
  } catch (error) {
    console.error('GET /api/teams error:', error)
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description, research_domain, collaboration_mode, agents } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Team name is required' }, { status: 400 })
    }
    if (!agents?.length || agents.length < 1) {
      return Response.json({ error: 'Add at least one agent' }, { status: 400 })
    }

    // Create team
    const team = await createTeam(user.id, {
      name: name.trim(),
      description: description?.trim() ?? '',
      research_domain: research_domain?.trim() ?? '',
      collaboration_mode: collaboration_mode ?? 'sequential',
    })

    // Create agents for this team
    const supabaseClient = await createClient()
    const agentRows = agents.map((agent, index) => ({
      team_id: team.id,
      user_id: user.id,
      name: agent.name,
      role: agent.role,
      description: agent.description ?? '',
      model_id: agent.model_id,
      system_prompt: agent.system_prompt ?? '',
      response_style: agent.response_style ?? 'balanced',
      order_index: index,
    }))

    const { error: agentsError } = await supabaseClient
      .from('agents')
      .insert(agentRows)

    if (agentsError) throw agentsError

    // Fetch complete team with agents
    const { data: fullTeam } = await supabaseClient
      .from('teams')
      .select('*, agents(*)')
      .eq('id', team.id)
      .single()

    return Response.json({ team: fullTeam }, { status: 201 })
  } catch (error) {
    console.error('POST /api/teams error:', error)
    return Response.json({ error: 'Failed to create team' }, { status: 500 })
  }
}