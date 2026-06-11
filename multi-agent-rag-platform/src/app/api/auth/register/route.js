import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return Response.json(
        { error: 'Email, password and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so user can login immediately
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 })
    }

    // Create profile row in public.profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail registration if profile insert fails
    }

    return Response.json({
      message: 'Account created successfully',
      user: { id: authData.user.id, email },
    })
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}