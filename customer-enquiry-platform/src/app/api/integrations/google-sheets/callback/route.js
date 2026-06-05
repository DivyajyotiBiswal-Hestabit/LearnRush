import { supabaseAdmin } from '@/lib/supabaseServer'
import { getTokensFromCode, getOAuthClient } from '@/lib/googleAuth'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_code', req.url)
      )
    }

    const tokens = await getTokensFromCode(
      code,
      'http://localhost:3000/api/integrations/google-sheets/callback'
    )

    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()

    const userId = state

    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'google_sheets')
      .single()

    if (existing) {
      await supabaseAdmin
        .from('integrations')
        .update({
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            email: googleUser.email,
          },
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: userId,
          type: 'google_sheets',
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            email: googleUser.email,
          },
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=google_sheets', req.url)
    )
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${error.message}`, req.url)
    )
  }
}