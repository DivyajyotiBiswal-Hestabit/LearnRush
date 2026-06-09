import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import axios from 'axios'

// POST — save Slack webhook URL
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

    const { webhook_url, channel_name } = await req.json()

    // Test the webhook first
    try {
      await axios.post(webhook_url, {
        text: '✅ FlowAgent connected successfully! You will receive alerts here.'
      })
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Slack webhook URL' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'slack')
      .single()

    if (existing) {
      await supabaseAdmin
        .from('integrations')
        .update({
          webhook_url,
          credentials: { channel_name },
          status: 'connected',
          connected_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: user.id,
          type: 'slack',
          webhook_url,
          credentials: { channel_name },
          status: 'connected',
          connected_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — disconnect Slack
export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabaseAdmin
      .from('integrations')
      .update({ status: 'disconnected', webhook_url: null })
      .eq('user_id', user.id)
      .eq('type', 'slack')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}