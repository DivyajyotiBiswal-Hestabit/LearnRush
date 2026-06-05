import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import axios from 'axios'

async function generateAndSaveScorecard(executionId) {
  try {
    const { data: execution } = await supabaseAdmin
      .from('executions')
      .select('*')
      .eq('id', executionId)
      .single()

    const { data: logs } = await supabaseAdmin
      .from('execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true })

    if (!execution) return

    const prompt = `
You are a quality assessor. Score this customer support automation execution.

Message: ${execution.original_message?.substring(0,150)}
Reply: ${execution.final_reply?.substring(0,150)}

Respond ONLY with this JSON:
{
  "overall_score": 8,
  "classifier_score": 8,
  "researcher_score": 7,
  "qualifier_score": 8,
  "responder_score": 9,
  "executor_score": 8,
  "response_relevance": 8,
  "response_completeness": 7,
  "bottleneck_agent": "researcher",
  "bottleneck_reason": "brief reason",
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`

    const response = await axios.post(
      `${process.env.OLLAMA_BASE_URL}/api/generate`,
      {
        model: 'tinyllama',
        prompt,
        stream: false
      },
      { timeout: 60000 }
    )

    const text = response.data.response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')

    const scores = JSON.parse(jsonMatch[0])

    await supabaseAdmin
      .from('scorecards')
      .insert({
        execution_id: executionId,
        overall_score: scores.overall_score,
        classifier_score: scores.classifier_score,
        researcher_score: scores.researcher_score,
        qualifier_score: scores.qualifier_score,
        responder_score: scores.responder_score,
        executor_score: scores.executor_score,
        response_relevance: scores.response_relevance,
        response_completeness: scores.response_completeness,
        bottleneck_agent: scores.bottleneck_agent,
        bottleneck_reason: scores.bottleneck_reason,
        suggestions: scores.suggestions
      })

    console.log('Scorecard generated for execution:', executionId)
  } catch (error) {
    console.error('Scorecard generation error:', error.message)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { execution_id, agent_role, status, output } = body

    console.log('n8n webhook received:', { execution_id, agent_role, status })
    console.log('output: ', output)

    if (!execution_id || !agent_role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: existingLog } = await supabaseAdmin
      .from('execution_logs')
      .select('id')
      .eq('execution_id', execution_id)
      .eq('agent_role', agent_role)
      .single()

    if (existingLog) {
      await supabaseAdmin
        .from('execution_logs')
        .update({
          status: 'completed',
          output: { result: output },
        })
        .eq('id', existingLog.id)
    } else {
      await supabaseAdmin
        .from('execution_logs')
        .insert({
          execution_id,
          agent_role,
          status: 'completed',
          output: { result: output },
          created_at: new Date().toISOString()
        })
    }

    if (agent_role === 'executor' && status === 'completed') {
      let finalReply = output
      try {
        const parsed = JSON.parse(output)
        if (parsed.final_reply) finalReply = parsed.final_reply
      } catch (e) {}

      await supabaseAdmin
        .from('executions')
        .update({
          status: 'completed',
          final_reply: finalReply,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution_id)

      console.log('Execution completed, generating scorecard...')
      // Generate scorecard in background
      generateAndSaveScorecard(execution_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('n8n webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}