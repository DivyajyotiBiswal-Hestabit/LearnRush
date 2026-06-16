import { createAdminClient } from '@/lib/supabase/admin'
import { AVAILABLE_MODELS } from '@/config/models'

/**
 * Evaluate a single routing rule condition against a query
 */
function evaluateCondition(condition, query) {
  const words = query.trim().split(/\s+/).length

  switch (condition.type) {
    case 'query_length_gt':
      return words > parseInt(condition.value)

    case 'query_length_lt':
      return words < parseInt(condition.value)

    case 'contains_keyword':
      return query.toLowerCase().includes(condition.value.toLowerCase())

    case 'topic_is':
      const topicKeywords = {
        technical: ['code', 'api', 'function', 'error', 'debug', 'implement', 'configure'],
        legal: ['contract', 'clause', 'law', 'legal', 'liability', 'agreement', 'regulation'],
        financial: ['revenue', 'profit', 'loss', 'financial', 'earnings', 'balance', 'cash'],
        scientific: ['study', 'research', 'hypothesis', 'data', 'experiment', 'methodology'],
        general: [],
      }
      const keywords = topicKeywords[condition.value] ?? []
      return keywords.length === 0 ||
        keywords.some(kw => query.toLowerCase().includes(kw))

    case 'time_of_day':
      const hour = new Date().getHours()
      const periods = {
        morning: hour >= 6 && hour < 12,
        afternoon: hour >= 12 && hour < 17,
        evening: hour >= 17 && hour < 21,
        night: hour >= 21 || hour < 6,
      }
      return periods[condition.value] ?? false

    default:
      return false
  }
}

/**
 * Apply routing rules to select the best model for a query
 * Returns the matched model ID or the default model
 */
export function applyRoutingRules(routingRules, query, defaultModelId) {
  if (!routingRules || routingRules.length === 0) {
    return { modelId: defaultModelId, matchedRule: null, reason: 'Using default model' }
  }

  // Check rules in priority order
  const sortedRules = [...routingRules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const rule of sortedRules) {
    if (!rule.conditions || rule.conditions.length === 0) continue

    // All conditions must match (AND logic)
    const allMatch = rule.conditions.every(cond => evaluateCondition(cond, query))

    if (allMatch && rule.action?.model_id) {
      return {
        modelId: rule.action.model_id,
        matchedRule: rule,
        reason: `Matched rule: "${rule.name}"`,
        temperature: rule.action.temperature,
        maxTokens: rule.action.max_tokens,
      }
    }
  }

  return { modelId: defaultModelId, matchedRule: null, reason: 'No rules matched, using default' }
}

/**
 * Log a routing decision
 */
export async function logRoutingDecision(userId, teamId, queryId, queryText, routingResult) {
  try {
    const admin = createAdminClient()
    await admin.from('routing_logs').insert({
      user_id: userId,
      team_id: teamId,
      query_id: queryId,
      query_text: queryText?.slice(0, 200),
      matched_rule: routingResult.matchedRule,
      assigned_model: routingResult.modelId,
      routing_reason: routingResult.reason,
    })
  } catch (err) {
    console.error('Routing log error:', err)
  }
}

/**
 * Get routing logs for a team
 */
export async function getRoutingLogs(teamId, limit = 20) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('routing_logs')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}