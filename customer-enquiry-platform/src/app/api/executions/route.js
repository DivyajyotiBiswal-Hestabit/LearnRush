import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
    const workflowId = searchParams.get('workflow_id')

    let query = supabaseAdmin
      .from('executions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data: executions, error } = await query
    if (error) throw error

    return NextResponse.json({ executions: executions || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}