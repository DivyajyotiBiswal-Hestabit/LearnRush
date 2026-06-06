import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import axios from 'axios'
export const maxDuration = 300
async function generateScorecard(execution, logs) {
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

    // Try multiple JSON extraction methods
    let parsed = null

    // Method 1: direct parse
    try {
      parsed = JSON.parse(text)
    } catch (e) {}

    // Method 2: extract JSON block
    if (!parsed) {
      const jsonMatch = text.match(/\{[^{}]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch (e) {}
      }
    }

    // Method 3: find first { to last }
    if (!parsed) {
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1) {
        try {
          parsed = JSON.parse(text.substring(start, end + 1))
        } catch (e) {}
      }
    }

    if (parsed && parsed.overall_score) {
      console.log('Scorecard generated successfully:', parsed.overall_score)
      return parsed
    }

    throw new Error('Could not parse JSON from response')

  } catch (error) {
    console.error('Ollama scorecard error:', error.message)

    // Fallback — calculate programmatically
    const hasGoodReply = execution.final_reply &&
      execution.final_reply.length > 100 &&
      !execution.final_reply.includes('"success":true')

    const completedAgents = logs.filter(l => l.status === 'completed').length
    const baseScore = hasGoodReply ? 7 : 5
    const agentBonus = completedAgents === 5 ? 1 : 0

    return {
      overall_score: baseScore + agentBonus,
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
        'Connect Google Drive with product catalog for accurate responses',
        'Add more specific business context when creating the workflow',
        'Consider adding pricing and policy documents to knowledge base'
      ]
    }
  }
}

// POST — generate scorecard for an execution
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { execution_id } = await req.json()

    // Check if scorecard already exists
    const { data: existing } = await supabaseAdmin
      .from('scorecards')
      .select('*')
      .eq('execution_id', execution_id)
      .single()

    if (existing) {
      return NextResponse.json({ scorecard: existing })
    }

    // Get execution and logs
    const { data: execution } = await supabaseAdmin
      .from('executions')
      .select('*')
      .eq('id', execution_id)
      .single()

    const { data: logs } = await supabaseAdmin
      .from('execution_logs')
      .select('*')
      .eq('execution_id', execution_id)
      .order('created_at', { ascending: true })

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    // Generate scorecard
    const scores = await generateScorecard(execution, logs || [])

    // Save to Supabase
    const { data: scorecard, error } = await supabaseAdmin
      .from('scorecards')
      .insert({
        execution_id,
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ scorecard })
  } catch (error) {
    console.error('Scorecard error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET — fetch scorecard for an execution
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const executionId = searchParams.get('execution_id')

    const { data: scorecard } = await supabaseAdmin
      .from('scorecards')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    return NextResponse.json({ scorecard: scorecard || null })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}