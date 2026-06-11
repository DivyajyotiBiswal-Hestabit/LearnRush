import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 401 })
    }

    return Response.json({
      message: 'Logged in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}