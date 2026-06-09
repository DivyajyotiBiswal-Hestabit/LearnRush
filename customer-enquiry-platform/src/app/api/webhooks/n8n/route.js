import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { sendSlackNotification, sendDiscordNotification } from '@/lib/notifications'
import { updateSheetsCRM } from '@/lib/sheetsHelper'

export const maxDuration = 300

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function generateAndSaveScorecard(executionId) {
  try {
    const { data: execution } = await supabaseAdmin
      .from('executions').select('*').eq('id', executionId).single()
    const { data: logs } = await supabaseAdmin
      .from('execution_logs').select('*').eq('execution_id', executionId)
      .order('created_at', { ascending: true })

    if (!execution) return

    const prompt = `Rate this customer support automation 1-10.
Customer message: "${execution.original_message?.substring(0, 200)}"
Final reply: "${execution.final_reply?.substring(0, 200)}"
Rules: Score 9-10 if reply directly addresses message, 7-8 if relevant but generic, 5-6 if partially relevant, 1-4 if irrelevant.
Respond ONLY with this JSON:
{"overall_score":8,"classifier_score":8,"researcher_score":7,"qualifier_score":8,"responder_score":8,"executor_score":8,"response_relevance":8,"response_completeness":7,"bottleneck_agent":"researcher","bottleneck_reason":"Could search better","suggestions":["Add product catalog","Use specific prompts"]}`

    let scores = null
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        temperature: 0.1,
        max_tokens: 300
      })
      const text = completion.choices[0]?.message?.content?.trim()
      console.log('Groq scorecard:', text?.substring(0, 100))
      try { scores = JSON.parse(text) } catch (e) {}
      if (!scores) {
        const match = text?.match(/\{[\s\S]*\}/)
        if (match) try { scores = JSON.parse(match[0]) } catch (e) {}
      }
    } catch (error) {
      console.error('Groq scorecard error:', error.message)
    }

    if (!scores || !scores.overall_score) {
      const hasGoodReply = execution.final_reply?.length > 100
      scores = {
        overall_score: hasGoodReply ? 8 : 5,
        classifier_score: 7, researcher_score: 7, qualifier_score: 7,
        responder_score: hasGoodReply ? 8 : 5, executor_score: 7,
        response_relevance: hasGoodReply ? 8 : 5,
        response_completeness: hasGoodReply ? 7 : 5,
        bottleneck_agent: 'researcher',
        bottleneck_reason: 'No knowledge base connected',
        suggestions: ['Connect Google Drive', 'Add business context', 'Add pricing docs']
      }
    }

    await supabaseAdmin.from('scorecards').insert({
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
    console.log('Scorecard saved:', executionId, 'Score:', scores.overall_score)
  } catch (error) {
    console.error('Scorecard error:', error.message)
  }
}

async function sendWhatsAppReply(to, message) {
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

async function sendGmailReply(userId, to, message, subject = 'Re: Your Inquiry') {
  try {
    const { data: integration } = await supabaseAdmin
      .from('integrations').select('credentials')
      .eq('user_id', userId).eq('type', 'gmail').eq('status', 'connected').single()

    if (!integration?.credentials) {
      console.log('No Gmail credentials found for user:', userId)
      return
    }

    const { google } = await import('googleapis')
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({
      access_token: integration.credentials.access_token,
      refresh_token: integration.credentials.refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      message
    ]
    const email = emailLines.join('\r\n')
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail }
    })
    console.log('Gmail sent to:', to, 'messageId:', result.data.id)
    return result.data
  } catch (error) {
    console.error('Gmail send error:', error.message)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { agent_role, status, output } = body

    // Fix execution_id extraction - handle nested object from n8n
    let execution_id = body.execution_id
    if (typeof execution_id === 'object' && execution_id?.body?.execution_id) {
      execution_id = execution_id.body.execution_id
    }

    console.log('n8n webhook received:', { execution_id, agent_role, status })
    console.log('output: ', output)

    if (!execution_id || !agent_role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Update execution log
    const { data: existingLog } = await supabaseAdmin
      .from('execution_logs').select('id')
      .eq('execution_id', execution_id).eq('agent_role', agent_role).single()

    if (existingLog) {
      await supabaseAdmin.from('execution_logs')
        .update({ status: 'completed', output: { result: output } })
        .eq('id', existingLog.id)
    } else {
      await supabaseAdmin.from('execution_logs').insert({
        execution_id, agent_role, status: 'completed',
        output: { result: output }, created_at: new Date().toISOString()
      })
    }

    // Executor done
    if (agent_role === 'executor' && status === 'completed') {
      let finalReply = output
      try {
        const parsed = JSON.parse(output)
        if (parsed.final_reply) {
          finalReply = typeof parsed.final_reply === 'object'
            ? parsed.final_reply.reply || JSON.stringify(parsed.final_reply)
            : parsed.final_reply
        }
      } catch (e) {}

      await supabaseAdmin.from('executions').update({
        status: 'completed',
        final_reply: finalReply,
        completed_at: new Date().toISOString()
      }).eq('id', execution_id)

      // Get execution details
      const { data: execution } = await supabaseAdmin
        .from('executions')
        .select('*, workflows(user_id, branching_rules, sheets_id, trigger_channel)')
        .eq('id', execution_id).single()

      if (execution) {
        const userId = execution.workflows?.user_id
        let channel = execution.trigger_channel || execution.channel ||'whatsapp'

        if (channel === 'text') channel = 'whatsapp'
        const sender = execution.original_sender

        console.log('Sending reply via channel:', channel, 'to:', sender)

        // Send reply to customer
        if (channel === 'whatsapp' && sender && finalReply) {
          await sendWhatsAppReply(sender, finalReply)
        }

        if (channel === 'gmail' && sender && finalReply) {
          await sendGmailReply(userId, sender, finalReply)
        }

        // Branching notifications
        const branchingRules = execution.workflows?.branching_rules || []
        const { data: qualifierLog } = await supabaseAdmin
          .from('execution_logs').select('output')
          .eq('execution_id', execution_id).eq('agent_role', 'qualifier').single()

        let qualifierData = {}
        try { qualifierData = JSON.parse(qualifierLog?.output?.result || '{}') } catch (e) {}

        for (const rule of branchingRules) {
          const shouldTrigger =
            (rule.condition === 'high_value_lead' && qualifierData.is_high_value) ||
            (rule.condition === 'needs_escalation' && qualifierData.needs_escalation)

          if (shouldTrigger) {
            const msg = `*High Priority Inquiry*\nCondition: ${rule.condition}\nAction: ${rule.action}`
            if (rule.action === 'notify_slack') {
              await sendSlackNotification(userId, msg, {
                original_message: execution.original_message,
                priority: 'high', channel
              })
            }
            if (rule.action === 'notify_email' || rule.action === 'escalate_human') {
              await sendDiscordNotification(userId, msg, {
                original_message: execution.original_message,
                priority: 'high', channel
              })
            }
          }
        }

        // Update CRM
        await updateSheetsCRM(userId, {
          execution_id,
          workflow_id: execution.workflow_id,
          channel: execution.trigger_channel,
          original_message: execution.original_message,
          final_reply: finalReply,
          status: 'completed',
          overall_score: ''         
        })
      }

      console.log('Generating scorecard...')
      generateAndSaveScorecard(execution_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('n8n webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}