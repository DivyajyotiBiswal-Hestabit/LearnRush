import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const { data: integrations } = await supabaseAdmin
      .from('integrations')
      .select('id, type, status, connected_at, credentials->email')
      .eq('user_id', user.id)

    return NextResponse.json({ integrations: integrations || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}