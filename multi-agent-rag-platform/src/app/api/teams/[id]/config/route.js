import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: team } = await supabase
      .from('teams')
      .select('id, debate_config, routing_config, memory_config, agents(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

    return Response.json({ config: team })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { debate_config, routing_config, memory_config, agents } = body

    // Update team-level config
    const teamUpdates = {}
    if (debate_config !== undefined) teamUpdates.debate_config = debate_config
    if (routing_config !== undefined) teamUpdates.routing_config = routing_config
    if (memory_config !== undefined) teamUpdates.memory_config = memory_config

    if (Object.keys(teamUpdates).length > 0) {
      await supabase
        .from('teams')
        .update(teamUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
    }

    // Update per-agent configs
    if (agents?.length) {
      for (const agent of agents) {
        if (!agent.id) continue
        const agentUpdates = {}
        if (agent.system_prompt !== undefined) agentUpdates.system_prompt = agent.system_prompt
        if (agent.temperature !== undefined) agentUpdates.temperature = agent.temperature
        if (agent.max_tokens !== undefined) agentUpdates.max_tokens = agent.max_tokens
        if (agent.routing_rules !== undefined) agentUpdates.routing_rules = agent.routing_rules
        if (agent.memory_enabled !== undefined) agentUpdates.memory_enabled = agent.memory_enabled
        if (agent.response_style !== undefined) agentUpdates.response_style = agent.response_style

        if (Object.keys(agentUpdates).length > 0) {
          await supabase
            .from('agents')
            .update(agentUpdates)
            .eq('id', agent.id)
        }
      }
    }

    return Response.json({ message: 'Config updated successfully' })
  } catch (error) {
    console.error('Config update error:', error)
    return Response.json({ error: 'Failed to update config' }, { status: 500 })
  }
}