import { supabaseAdmin } from '@/lib/supabaseServer'
import { n8nClient } from '@/lib/n8nClient'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(req) {
  try {
    const body = await req.json()
    console.log('Gmail webhook received:', JSON.stringify(body))

    const { from, subject, body: emailBody } = body

    // Extract sender email
    const emailMatch = from?.match(/<(.+)>/)
    const senderEmail = emailMatch ? emailMatch[1] : from
    const senderName = from?.replace(/<.+>/, '').trim() || senderEmail

    console.log('Processing Gmail from:', senderEmail)

    // Find Gmail integration
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('user_id, credentials')
      .eq('type', 'gmail')
      .eq('status', 'connected')
      .single()

    if (!integration) {
      console.log('No Gmail integration found')
      return NextResponse.json({ status: 'no_integration' })
    }

    const userId = integration.user_id

    // Find active Gmail workflow
    const { data: workflow } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_channel', 'gmail')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!workflow) {
      console.log('No active Gmail workflow found')
      return NextResponse.json({ status: 'no_workflow' })
    }

    console.log('Found workflow:', workflow.name)

    // Create execution record
    const { data: execution } = await supabaseAdmin
      .from('executions')
      .insert({
        workflow_id: workflow.id,
        user_id: userId,
        trigger_channel: 'gmail',
        original_message: emailBody || subject,
        original_sender: senderEmail,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    // Create pending logs
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

    // Trigger n8n Customer Enquiry Handler
    n8nClient.triggerWorkflow(
      process.env.N8N_WEBHOOK_PATH,
      {
        message: emailBody || subject,
        sender_name: senderName,
        sender_email: senderEmail,
        channel: 'gmail',
        subject: subject,
        business_context: workflow.business_context,
        execution_id: execution.id,
        workflow_id: workflow.id
      }
    ).then(async (n8nResponse) => {
      console.log('n8n completed for Gmail')

      let finalReply = ''
      let replySubject = `Re: ${subject}`

      try {
        if (n8nResponse?.output) {
          const parsed = JSON.parse(n8nResponse.output)
          if (parsed.final_reply) {
            finalReply = typeof parsed.final_reply === 'object'
              ? parsed.final_reply.reply || JSON.stringify(parsed.final_reply)
              : parsed.final_reply
          }
          if (parsed.subject) replySubject = parsed.subject
        }
      } catch (e) {
        finalReply = n8nResponse?.output || ''
      }

      // Send Gmail reply
      if (finalReply && finalReply.length > 10) {
        await sendGmailReply(
          integration.credentials,
          senderEmail,
          replySubject,
          finalReply
        )
        console.log('Gmail reply sent to:', senderEmail)
      }

      // Update execution
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
      console.error('n8n Gmail failed:', error.message)
      await supabaseAdmin
        .from('executions')
        .update({ status: 'failed' })
        .eq('id', execution.id)
    })

    return NextResponse.json({ status: 'processing', execution_id: execution.id })

  } catch (error) {
    console.error('Gmail webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendGmailReply(credentials, to, subject, body) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ]

    const email = emailLines.join('\r\n')
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail }
    })

    console.log('Gmail sent, messageId:', result.data.id)
    return result.data
  } catch (error) {
    console.error('Gmail send error:', error.message)
  }
}