'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchWorkflows = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/workflows', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async (workflowData) => {
    try {
      const token = await getToken()
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(workflowData)
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await fetchWorkflows()
      return data
    } catch (error) {
      throw error
    }
  }

  const deleteWorkflow = async (id) => {
    try {
      const token = await getToken()
      await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchWorkflows()
    } catch (error) {
      throw error
    }
  }

  const triggerWorkflow = async (id, payload) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/workflows/${id}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    fetchWorkflows()
  }, [])

  return {
    workflows,
    loading,
    createWorkflow,
    deleteWorkflow,
    triggerWorkflow,
    refetch: fetchWorkflows
  }
}