'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchAnalytics = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScorecard = async (executionId) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/scorecard?execution_id=${executionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      return data.scorecard
    } catch (error) {
      return null
    }
  }

  const generateScorecard = async (executionId) => {
    try {
      const token = await getToken()
      const res = await fetch('/api/scorecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ execution_id: executionId })
      })
      const data = await res.json()
      return data.scorecard
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    analytics,
    loading,
    fetchScorecard,
    generateScorecard,
    refetch: fetchAnalytics
  }
}