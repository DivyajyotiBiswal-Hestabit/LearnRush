import { supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { data: templates, error } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}