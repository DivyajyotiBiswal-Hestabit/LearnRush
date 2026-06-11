import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── TEAMS ────────────────────────────────────────────────

export async function getTeams(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      agents (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTeamById(teamId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      agents (*)
    `)
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data
}

export async function createTeam(userId, teamData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .insert({ ...teamData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTeam(teamId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTeam(teamId) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('teams')
    .update({ is_active: false })
    .eq('id', teamId)

  if (error) throw error
}

// ─── AGENTS ───────────────────────────────────────────────

export async function createAgent(userId, agentData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agents')
    .insert({ ...agentData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAgent(agentId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAgent(agentId) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId)

  if (error) throw error
}

// ─── KNOWLEDGE BASES ──────────────────────────────────────

export async function getKnowledgeBases(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select(`*, documents(count)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getKnowledgeBaseById(kbId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select(`*, documents(*)`)
    .eq('id', kbId)
    .single()

  if (error) throw error
  return data
}

export async function createKnowledgeBase(userId, kbData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert({ ...kbData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── DOCUMENTS ────────────────────────────────────────────

export async function createDocument(userId, docData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .insert({ ...docData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDocument(docId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── CHAT SESSIONS ────────────────────────────────────────

export async function getChatSessions(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`*, teams(name), queries(count)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createChatSession(userId, sessionData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ ...sessionData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChatSession(sessionId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── QUERIES ──────────────────────────────────────────────

export async function createQuery(userId, queryData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('queries')
    .insert({ ...queryData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuery(queryId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('queries')
    .update(updates)
    .eq('id', queryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getQueryWithTraces(queryId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('queries')
    .select(`
      *,
      agent_traces(*),
      citations(*)
    `)
    .eq('id', queryId)
    .single()

  if (error) throw error
  return data
}

// ─── AGENT TRACES ─────────────────────────────────────────

export async function createAgentTrace(userId, traceData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agent_traces')
    .insert({ ...traceData, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAgentTrace(traceId, updates) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agent_traces')
    .update(updates)
    .eq('id', traceId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── ANALYTICS ────────────────────────────────────────────

export async function logAnalyticsEvent(userId, eventType, eventData = {}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('analytics_events')
    .insert({ user_id: userId, event_type: eventType, event_data: eventData })

  if (error) console.error('Analytics log error:', error)
}

export async function getUserAnalytics(userId) {
  const supabase = await createClient()

  const [queriesResult, sessionsResult, teamsResult] = await Promise.all([
    supabase
      .from('queries')
      .select('id, quality_score, processing_time_ms, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('chat_sessions')
      .select('id, created_at, total_queries, avg_quality_score')
      .eq('user_id', userId),
    supabase
      .from('teams')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  return {
    queries: queriesResult.data ?? [],
    sessions: sessionsResult.data ?? [],
    teams: teamsResult.data ?? [],
  }
}