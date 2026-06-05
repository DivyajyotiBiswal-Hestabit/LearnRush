import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { n8nClient } from '@/lib/n8nClient'
import { NextResponse } from 'next/server'

export const maxDuration = 300

export async function POST(req, { params }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { message, sender_name, sender_email, channel } = body

    // Get workflow
    const { data: workflow } = await supabaseAdmin
      .from('workflows')
      .select('*, agents(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Create execution record immediately
    const { data: execution } = await supabaseAdmin
      .from('executions')
      .insert({
        workflow_id: id,
        user_id: user.id,
        trigger_channel: channel || workflow.trigger_channel,
        original_message: message,
        original_sender: sender_email || sender_name,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    // Create initial pending logs for all 5 agents
    const agentRoles = ['classifier', 'researcher', 'qualifier', 'responder', 'executor']
    for (const role of agentRoles) {
      await supabaseAdmin
        .from('execution_logs')
        .insert({
          execution_id: execution.id,
          agent_role: role,
          status: 'pending',
          output: null,
          created_at: new Date().toISOString()
        })
    }

    // Trigger n8n workflow (fire and forget — don't await)
    n8nClient.triggerWorkflow(
      process.env.N8N_WEBHOOK_PATH,
      {
        message,
        sender_name,
        sender_email,
        channel: channel || workflow.trigger_channel,
        business_context: workflow.business_context,
        execution_id: execution.id,
        workflow_id: id,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`
      }
    ).then(async (n8nResponse) => {
      console.log('n8n full response:', JSON.stringify(n8nResponse))

      let finalReply = ''
      if (typeof n8nResponse === 'string') {
        finalReply = n8nResponse
      } else if (n8nResponse?.output) {
        finalReply = n8nResponse.output
      } else if (n8nResponse?.final_reply) {
        finalReply = n8nResponse.final_reply
      } else if (n8nResponse?.executor_output) {
        finalReply = n8nResponse.executor_output
      } else {
        finalReply = JSON.stringify(n8nResponse)
      }

      await supabaseAdmin
        .from('executions')
        .update({
          status: 'completed',
          final_reply: finalReply,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - new Date(execution.started_at).getTime()
        })
        .eq('id', execution.id)

    }).catch(async (error) => {
      console.error('n8n execution failed:', error)
      await supabaseAdmin
        .from('executions')
        .update({ status: 'failed' })
        .eq('id', execution.id)
    })

    // Return immediately with execution ID
    return NextResponse.json({
      success: true,
      execution_id: execution.id,
      status: 'running'
    })

  } catch (error) {
    console.error('Trigger error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}