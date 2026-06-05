import { supabaseAdmin } from '@/lib/supabaseServer'
import { getTokensFromCode } from '@/lib/googleAuth'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id passed in state

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_code', req.url)
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(
      code,
      'http://localhost:3000/api/integrations/gmail/callback'
    )

    // Get user email from Google
    const { google: googleLib } = await import('googleapis')
    const oauth2Client = new (await import('@/lib/googleAuth')).getOAuthClient()
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()

    // Get user_id from state parameter
    const userId = state

    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=no_user', req.url)
      )
    }

    // Save or update integration in Supabase
    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'gmail')
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
          type: 'gmail',
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
      new URL('/dashboard/integrations?success=gmail', req.url)
    )
  } catch (error) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${error.message}`, req.url)
    )
  }
}