import { createAdminClient } from '@/lib/supabase/admin'
import { ollamaChat } from '@/lib/ollama'

/**
 * Fetch all active memories for a team
 */
export async function getTeamMemories(teamId, userId, limit = 10) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('agent_memory')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Memory fetch error:', error)
    return []
  }

  return data ?? []
}

/**
 * Format memories into a context string for agent prompts
 */
export function formatMemoriesAsContext(memories) {
  if (!memories || memories.length === 0) return ''

  const grouped = {}
  memories.forEach(m => {
    if (!grouped[m.memory_type]) grouped[m.memory_type] = []
    grouped[m.memory_type].push(m.content)
  })

  let context = '## Shared Memory from Previous Sessions\n'

  if (grouped.fact?.length) {
    context += `\n### Known Facts\n${grouped.fact.map(f => `- ${f}`).join('\n')}\n`
  }
  if (grouped.preference?.length) {
    context += `\n### User Preferences\n${grouped.preference.map(p => `- ${p}`).join('\n')}\n`
  }
  if (grouped.context?.length) {
    context += `\n### Ongoing Context\n${grouped.context.map(c => `- ${c}`).join('\n')}\n`
  }
  if (grouped.summary?.length) {
    context += `\n### Previous Session Summaries\n${grouped.summary.map(s => `- ${s}`).join('\n')}\n`
  }

  return context
}

/**
 * Extract and save new memories from a completed query
 */
export async function extractAndSaveMemories(
  question,
  finalAnswer,
  teamId,
  userId,
  queryId,
  modelId = 'llama3:latest'
) {
  const prompt = `You are a memory extraction system. Given a research question and answer, extract important facts, preferences, or context worth remembering for future sessions.

Question: ${question}

Answer: ${finalAnswer.slice(0, 1000)}

Extract up to 3 memories worth storing. Respond ONLY with a JSON array like this (no markdown, no explanation):
[
  {"type": "fact", "content": "The key finding was...", "importance": 8},
  {"type": "context", "content": "User is researching...", "importance": 6}
]

Types: "fact" (specific facts), "preference" (user style/preferences), "context" (ongoing project info), "summary" (session summary)
Importance: 1-10 (10 = most important)
Only include memories that would genuinely help future queries. Return [] if nothing is worth saving.`

  try {
    const response = await ollamaChat(modelId, [
      { role: 'user', content: prompt }
    ], { temperature: 0.1 })

    const cleaned = response.replace(/```json|```/g, '').trim()
    const memories = JSON.parse(cleaned)

    if (!Array.isArray(memories) || memories.length === 0) return

    const admin = createAdminClient()
    const rows = memories
      .filter(m => m.content && m.type)
      .map(m => ({
        user_id: userId,
        team_id: teamId,
        memory_type: m.type,
        content: m.content,
        source_query_id: queryId,
        importance: Math.min(10, Math.max(1, m.importance ?? 5)),
      }))

    if (rows.length > 0) {
      await admin.from('agent_memory').insert(rows)
    }
  } catch (err) {
    console.error('Memory extraction error:', err)
    // Non-fatal — don't throw
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId) {
  const admin = createAdminClient()
  await admin
    .from('agent_memory')
    .update({ is_active: false })
    .eq('id', memoryId)
}

/**
 * Add a manual memory entry
 */
export async function addManualMemory(userId, teamId, content, memoryType, importance = 5) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_memory')
    .insert({
      user_id: userId,
      team_id: teamId,
      memory_type: memoryType,
      content,
      importance,
    })
    .select()
    .single()

  if (error) throw error
  return data
}