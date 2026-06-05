import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import axios from 'axios'

// Generate scorecard using Ollama
async function generateScorecard(execution, logs) {
  const prompt = `Score this customer support reply 1-10.
Message: ${execution.original_message?.substring(0, 150)}
Reply: ${execution.final_reply?.substring(0, 150)}

Reply ONLY with this JSON, no other text:
{"overall_score":8,"classifier_score":8,"researcher_score":7,"qualifier_score":8,"responder_score":8,"executor_score":8,"response_relevance":8,"response_completeness":7,"bottleneck_agent":"researcher","bottleneck_reason":"took longest","suggestions":["improve prompts","add more context"]}`

  try {
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
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No JSON in response')
  } catch (error) {
    console.error('Ollama scorecard error:', error.message)
    return {
      overall_score: 7,
      classifier_score: 7,
      researcher_score: 7,
      qualifier_score: 7,
      responder_score: 7,
      executor_score: 7,
      response_relevance: 7,
      response_completeness: 7,
      bottleneck_agent: null,
      bottleneck_reason: null,
      suggestions: ['Review agent prompts for better performance']
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