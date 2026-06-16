import { createClient } from '@/lib/supabase/server'
import { TEAM_TEMPLATES } from '@/config/templates'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { templateId, customName } = await request.json()

    const template = TEAM_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        user_id: user.id,
        name: customName || template.name,
        description: template.description,
        research_domain: template.research_domain,
        collaboration_mode: template.collaboration_mode,
        is_active: true,
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Create the agents
    const agentRows = template.agents.map((agent, index) => ({
      team_id: team.id,
      user_id: user.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      model_id: agent.model_id,
      system_prompt: agent.system_prompt,
      response_style: agent.response_style,
      order_index: index,
      is_active: true,
    }))

    const { error: agentsError } = await supabase
      .from('agents')
      .insert(agentRows)

    if (agentsError) throw agentsError

    // Fetch the complete team
    const { data: fullTeam } = await supabase
      .from('teams')
      .select('*, agents(*)')
      .eq('id', team.id)
      .single()

    return Response.json({ team: fullTeam }, { status: 201 })
  } catch (error) {
    console.error('Template creation error:', error)
    return Response.json({ error: 'Failed to create team from template' }, { status: 500 })
  }
}