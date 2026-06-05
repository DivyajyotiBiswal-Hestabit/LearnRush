'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useAuthActions() {
  const [loading, setLoading] = useState(false)

  const register = async (email, password, fullName) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) throw error
      toast.success('Account created! Please log in.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      // Wait for session to be fully stored
      await supabase.auth.getSession()

      toast.success('Welcome back!')
      setTimeout(() => {
        window.location.replace('/dashboard')
      }, 500)
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      window.location.replace('/login')
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return { register, login, logout, loading }
}