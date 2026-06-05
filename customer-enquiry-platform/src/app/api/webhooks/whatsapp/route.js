import { NextResponse } from 'next/server'

// GET — WhatsApp webhook verification
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('WhatsApp verification attempt:', { mode, token, challenge })

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully')
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    console.log('WhatsApp verification failed - token mismatch')
    return new Response('Forbidden', { status: 403 })
  } catch (error) {
    console.error('Webhook verification error:', error)
    return new Response('Error', { status: 500 })
  }
}

// POST — Receive incoming WhatsApp messages
export async function POST(req) {
  try {
    const body = await req.json()
    console.log('Incoming WhatsApp message:', JSON.stringify(body, null, 2))

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const message = changes?.value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }

    const from = message.from
    const text = message.text?.body || ''
    console.log('Message from:', from, 'Text:', text)

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}