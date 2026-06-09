import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
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

    const { data: workflow, error } = await supabaseAdmin
      .from('workflows')
      .select(`*, agents(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return NextResponse.json({ workflow })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
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

    const { data: workflow, error } = await supabaseAdmin
      .from('workflows')
      .update({
        name: body.name,
        business_context: body.business_context,
        trigger_channel: body.trigger_channel,
        status: body.status,
        updated_at: new Date().toISOString(),
        ...(body.sheets_id !== undefined && {
          sheets_id: body.sheets_id
        })
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    if (body.agents) {
      await supabaseAdmin.from('agents').delete().eq('workflow_id', id)
      const agentsData = body.agents.map((agent, index) => ({
        workflow_id: id,
        role: agent.role,
        system_prompt: agent.system_prompt,
        tools: agent.tools,
        order_index: index + 1
      }))
      await supabaseAdmin.from('agents').insert(agentsData)
    }

    return NextResponse.json({ workflow, success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
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

    const { error } = await supabaseAdmin
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}