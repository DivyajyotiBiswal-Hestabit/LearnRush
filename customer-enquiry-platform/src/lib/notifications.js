import axios from 'axios'
import { supabaseAdmin } from './supabaseServer'

export async function sendSlackNotification(userId, message, data = {}) {
  try {
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('webhook_url, credentials')
      .eq('user_id', userId)
      .eq('type', 'slack')
      .eq('status', 'connected')
      .single()

    if (!integration?.webhook_url) return false

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'FlowAgent Alert'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    }

    if (data.original_message) {
      payload.blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Message:*\n${data.original_message?.substring(0, 200)}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${data.priority || 'high'}\n*Channel:* ${data.channel || 'email'}`
          }
        ]
      })
    }

    await axios.post(integration.webhook_url, payload)
    return true
  } catch (error) {
    console.error('Slack notification error:', error.message)
    return false
  }
}

export async function sendDiscordNotification(userId, message, data = {}) {
  try {
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('webhook_url')
      .eq('user_id', userId)
      .eq('type', 'discord')
      .eq('status', 'connected')
      .single()

    if (!integration?.webhook_url) return false

    await axios.post(integration.webhook_url, {
      embeds: [{
        title: 'FlowAgent Alert',
        description: message,
        color: 0xf97316,
        fields: data.original_message ? [
          {
            name: 'Customer Message',
            value: data.original_message?.substring(0, 200),
            inline: false
          },
          {
            name: 'Priority',
            value: data.priority || 'high',
            inline: true
          },
          {
            name: 'Channel',
            value: data.channel || 'email',
            inline: true
          }
        ] : []
      }]
    })
    return true
  } catch (error) {
    console.error('Discord notification error:', error.message)
    return false
  }
}