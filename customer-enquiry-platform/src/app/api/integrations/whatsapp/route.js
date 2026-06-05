import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST — save WhatsApp credentials manually entered by user
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

    const { api_token, phone_number_id } = await req.json()

    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'whatsapp')
      .single()

    if (existing) {
      await supabaseAdmin
        .from('integrations')
        .update({
          credentials: { api_token, phone_number_id },
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: user.id,
          type: 'whatsapp',
          credentials: { api_token, phone_number_id },
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — disconnect WhatsApp
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
      .update({ status: 'disconnected', credentials: null })
      .eq('user_id', user.id)
      .eq('type', 'whatsapp')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}