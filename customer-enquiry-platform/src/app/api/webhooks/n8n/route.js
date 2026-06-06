import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import axios from 'axios'

export const maxDuration = 300

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

    const prompt = `Rate this customer support automation 1-10.

Customer message: "${execution.original_message?.substring(0, 200)}"
Final reply: "${execution.final_reply?.substring(0, 200)}"

Rules:
- Score 9-10 if reply directly addresses the message
- Score 7-8 if reply is relevant but generic
- Score 5-6 if reply is partially relevant
- Score 1-4 if reply is irrelevant or wrong

You MUST respond with ONLY this JSON and nothing else, no explanation:
{"overall_score":8,"classifier_score":8,"researcher_score":7,"qualifier_score":8,"responder_score":8,"executor_score":8,"response_relevance":8,"response_completeness":7,"bottleneck_agent":"researcher","bottleneck_reason":"Could search better","suggestions":["Add product catalog to Drive","Use more specific prompts","Add pricing information"]}

Respond with ONLY the JSON above, nothing before or after it.`

    let scores = null

    try {
      const response = await axios.post(
        `${process.env.OLLAMA_BASE_URL}/api/generate`,
        {
          model: 'mistral',
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 200
          }
        },
        { timeout: 180000 }
      )

      const text = response.data.response.trim()
      console.log('Scorecard raw response:', text.substring(0, 200))

      // Method 1: direct parse
      try { scores = JSON.parse(text) } catch (e) {}

      // Method 2: extract JSON block
      if (!scores) {
        const jsonMatch = text.match(/\{[^{}]*\}/)
        if (jsonMatch) {
          try { scores = JSON.parse(jsonMatch[0]) } catch (e) {}
        }
      }

      // Method 3: first { to last }
      if (!scores) {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1) {
          try {
            scores = JSON.parse(text.substring(start, end + 1))
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Ollama error:', error.message)
    }

    // Fallback if AI fails
    if (!scores || !scores.overall_score) {
      const hasGoodReply = execution.final_reply &&
        execution.final_reply.length > 100 &&
        !execution.final_reply.includes('"success":true')
      const completedAgents = logs?.filter(l => l.status === 'completed').length || 0

      scores = {
        overall_score: hasGoodReply ? 8 : 5,
        classifier_score: 7,
        researcher_score: 7,
        qualifier_score: 7,
        responder_score: hasGoodReply ? 8 : 5,
        executor_score: 7,
        response_relevance: hasGoodReply ? 8 : 5,
        response_completeness: hasGoodReply ? 7 : 5,
        bottleneck_agent: 'researcher',
        bottleneck_reason: 'No Google Drive knowledge base connected',
        suggestions: [
          'Connect Google Drive with product catalog',
          'Add more specific business context',
          'Add pricing and policy documents'
        ]
      }
    }

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

    console.log('Scorecard saved for execution:', executionId, 'Score:', scores.overall_score)
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

    // Check if log already exists
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

    // Executor done → save final reply + generate scorecard
    if (agent_role === 'executor' && status === 'completed') {
      let finalReply = output
      try {
        const parsed = JSON.parse(output)
        // Handle nested final_reply object
        if (parsed.final_reply) {
          if (typeof parsed.final_reply === 'object') {
            finalReply = parsed.final_reply.reply || JSON.stringify(parsed.final_reply)
          } else {
            finalReply = parsed.final_reply
          }
        }
      } catch (e) {
        finalReply = output
      }

      await supabaseAdmin
        .from('executions')
        .update({
          status: 'completed',
          final_reply: finalReply,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution_id)

      console.log('Execution completed, generating scorecard...')
      // Fire and forget — don't await
      generateAndSaveScorecard(execution_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('n8n webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}