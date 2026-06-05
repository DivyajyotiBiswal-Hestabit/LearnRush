'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useExecutions(workflowId = null) {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchExecutions = async () => {
    try {
      const token = await getToken()
      const url = workflowId
        ? `/api/executions?workflow_id=${workflowId}`
        : '/api/executions'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setExecutions(data.executions || [])
    } catch (error) {
      console.error('Error fetching executions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecution = async (id) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/executions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return await res.json()
    } catch (error) {
      console.error('Error fetching execution:', error)
      return null
    }
  }

  useEffect(() => {
    fetchExecutions()

    const channel = supabase
      .channel(`executions-${workflowId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions'
        },
        () => fetchExecutions()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workflowId])

  return {
    executions,
    loading,
    fetchExecution,
    refetch: fetchExecutions
  }
}