import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runMultiAgentPipeline } from '@/lib/agents/orchestrator'
import { extractAndSaveMemories } from '@/lib/agents/memory'
import { logRoutingDecision } from '@/lib/agents/router'


export const maxDuration = 300

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, teamId, knowledgeBaseId, sessionId } = body

  if (!question?.trim()) {
    return Response.json({ error: 'Question is required' }, { status: 400 })
  }
  if (!teamId) {
    return Response.json({ error: 'Team is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch team with agents
  const { data: team } = await admin
    .from('teams')
    .select('*, agents(*)')
    .eq('id', teamId)
    .single()

  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

  const agents = team.agents?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) ?? []

  if (agents.length === 0) {
    return Response.json({ error: 'Team has no agents' }, { status: 400 })
  }

  // Create or reuse session
  let currentSessionId = sessionId
  if (!currentSessionId) {
    const { data: session } = await admin
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        team_id: teamId,
        knowledge_base_id: knowledgeBaseId ?? null,
        title: question.slice(0, 60),
        status: 'active',
      })
      .select()
      .single()
    currentSessionId = session.id
  }

  // Create query record
  const { data: queryRecord } = await admin
    .from('queries')
    .insert({
      session_id: currentSessionId,
      user_id: user.id,
      team_id: teamId,
      question: question.trim(),
      status: 'processing',
    })
    .select()
    .single()

  // Set up SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type, data) {
        const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      try {
        sendEvent('session', { sessionId: currentSessionId, queryId: queryRecord.id })

        const result = await runMultiAgentPipeline({
          question: question.trim(),
          agents,
          knowledgeBaseId: knowledgeBaseId ?? null,
          teamId,
          userId: user.id,
          collaborationMode: team.collaboration_mode,
          debateConfig: team.debate_config ?? {},
          memoryEnabled: team.memory_config?.enabled ?? false,
          ragOptions: {
            useLLMRerank: true,
            vectorWeight: 0.7,
            keywordWeight: 0.3,
            topK: 6,
            threshold: 0.3,

          },
          onTraceUpdate: (trace) => {
            sendEvent('trace', trace)
          },
        })

        // Save agent traces to DB
        for (const trace of result.agentTraces) {
          await admin.from('agent_traces').insert({
            query_id: queryRecord.id,
            agent_id: trace.agentId ?? null,
            user_id: user.id,
            agent_name: trace.agentName,
            agent_role: trace.role,
            model_id: trace.modelId,
            output: trace.output,
            processing_time_ms: trace.processingTime,
            step_index: trace.stepIndex,
            status: trace.status,
          })
        }

        if (team.memory_config?.enabled && result.finalAnswer) {
          const firstModel = agents[0]?.model_id ?? 'llama3:latest'
          await extractAndSaveMemories(
            question.trim(),
            result.finalAnswer,
            teamId,
            user.id,
            queryRecord.id,
            firstModel  
          )
        }

        // Update query record with final answer + scores
        await admin.from('queries').update({
          final_answer: result.finalAnswer,
          status: 'completed',
          quality_score: result.scores.quality,
          citation_accuracy: result.scores.citation_accuracy,
          insight_depth: result.scores.insight_depth,
          processing_time_ms: result.processingTime,
          chunks_retrieved: result.chunks.length,
          completed_at: new Date().toISOString(),
        }).eq('id', queryRecord.id)

        // Update session stats
        await admin.from('chat_sessions').update({
          total_queries: team.total_queries + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', currentSessionId)

        sendEvent('answer', {
          answer: result.finalAnswer,
          scores: result.scores,
          processingTime: result.processingTime,
          chunksRetrieved: result.chunks.length,
          queryId: queryRecord.id,
          sessionId: currentSessionId,
        })

        sendEvent('done', {})
      } catch (error) {
        console.error('Chat pipeline error:', error)

        await admin.from('queries').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        }).eq('id', queryRecord.id)

        sendEvent('error', { message: error.message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}