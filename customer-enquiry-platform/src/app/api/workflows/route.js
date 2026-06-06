import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {branching_rules} from '@/components/workflows/BranchRuleEditor'

// GET all workflows for logged in user
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

    const { data: workflows, error } = await supabaseAdmin
      .from('workflows')
      .select(`*, agents(*)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ workflows: workflows || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new workflow
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

    const body = await req.json()
    const {
      name,
      business_context,
      trigger_channel,
      agents
    } = body

    // Save workflow to Supabase
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .insert({
        user_id: user.id,
        name,
        business_context,
        trigger_channel,
        status: 'active',
        n8n_workflow_id: process.env.N8N_WORKFLOW_ID,
        n8n_webhook_url: `${process.env.N8N_BASE_URL}/webhook/${process.env.N8N_WEBHOOK_PATH}`,
        branching_rules: body.branching_rules || []
      })
      .select()
      .single()

    if (workflowError) throw workflowError

    // Save agents to Supabase
    if (agents && agents.length > 0) {
      const agentsData = agents.map((agent, index) => ({
        workflow_id: workflow.id,
        role: agent.role,
        system_prompt: agent.system_prompt,
        tools: agent.tools,
        order_index: index + 1
      }))

      const { error: agentsError } = await supabaseAdmin
        .from('agents')
        .insert(agentsData)

      if (agentsError) throw agentsError
    }

    return NextResponse.json({ workflow, success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}