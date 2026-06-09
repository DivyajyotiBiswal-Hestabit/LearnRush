import { supabaseAdmin } from '@/lib/supabaseServer'
import { n8nClient } from '@/lib/n8nClient'
import { NextResponse } from 'next/server'

// GET — WhatsApp webhook verification
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('WhatsApp verification:', { mode, token })

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully')
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    return new Response('Forbidden', { status: 403 })
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
}

// POST — Receive incoming WhatsApp messages
export async function POST(req) {
  try {
    const body = await req.json()
    console.log('WhatsApp incoming:', JSON.stringify(body, null, 2))

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const message = changes?.value?.messages?.[0]
    const contact = changes?.value?.contacts?.[0]

    // Ignore non-text messages and status updates
    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ignored' })
    }

    const from = message.from
    const text = message.text?.body || ''
    const senderName = contact?.profile?.name || from

    console.log('Processing WhatsApp message:', { from, text, senderName })

    // Find WhatsApp integration to get user_id
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('user_id, credentials')
      .eq('type', 'whatsapp')
      .eq('status', 'connected')
      .single()

    if (!integration) {
      console.log('No WhatsApp integration found')
      await sendWhatsAppMessage(from, "Thank you for your message. We'll get back to you shortly.")
      return NextResponse.json({ status: 'no_integration' })
    }

    const userId = integration.user_id

    // Find active WhatsApp workflow for this user
    const { data: workflow } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_channel', 'whatsapp')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!workflow) {
      console.log('No active WhatsApp workflow found')
      await sendWhatsAppMessage(from, "Thank you for contacting us! We'll respond shortly.")
      return NextResponse.json({ status: 'no_workflow' })
    }

    console.log('Found workflow:', workflow.name)

    // Create execution record
    const { data: execution } = await supabaseAdmin
      .from('executions')
      .insert({
        workflow_id: workflow.id,
        user_id: userId,
        trigger_channel: 'whatsapp',
        original_message: text,
        original_sender: from,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    // Create pending logs for all 5 agents
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

    // Send acknowledgment to customer immediately
    await sendWhatsAppMessage(
      from,
      `Hi ${senderName}! 👋 We received your message and our AI team is processing it. We'll reply shortly!`
    )

    // Trigger n8n workflow in background
    n8nClient.triggerWorkflow(
      process.env.N8N_WEBHOOK_PATH,
      {
        message: text,
        sender_name: senderName,
        sender_phone: from,
        sender_email: '',
        channel: 'whatsapp',
        business_context: workflow.business_context,
        execution_id: execution.id,
        workflow_id: workflow.id,
        reply_to_phone: from
      }
    ).then(async (n8nResponse) => {
      console.log('n8n response received for WhatsApp')

      // Extract final reply text
      let finalReply = ''
      try {
        if (n8nResponse?.output) {
          const parsed = JSON.parse(n8nResponse.output)
          if (parsed.final_reply) {
            finalReply = typeof parsed.final_reply === 'object'
              ? parsed.final_reply.reply || JSON.stringify(parsed.final_reply)
              : parsed.final_reply
          } else {
            finalReply = n8nResponse.output
          }
        } else if (typeof n8nResponse === 'string') {
          finalReply = n8nResponse
        }
      } catch (e) {
        finalReply = n8nResponse?.output || ''
      }

      // Send AI reply to customer on WhatsApp
      if (finalReply && finalReply.length > 10) {
        await sendWhatsAppMessage(from, finalReply)
        console.log('AI reply sent to WhatsApp:', from)
      }

      // Update execution record
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
      console.error('n8n WhatsApp trigger failed:', error.message)
      await supabaseAdmin
        .from('executions')
        .update({ status: 'failed' })
        .eq('id', execution.id)
      await sendWhatsAppMessage(
        from,
        "Sorry, we couldn't process your message right now. Please try again in a few minutes."
      )
    })

    // Return immediately to Meta (must respond within 20 seconds)
    return NextResponse.json({ status: 'processing' })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper — Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    )
    const data = await res.json()
    console.log('WhatsApp send result:', JSON.stringify(data))
    return data
  } catch (error) {
    console.error('WhatsApp send error:', error.message)
  }
}