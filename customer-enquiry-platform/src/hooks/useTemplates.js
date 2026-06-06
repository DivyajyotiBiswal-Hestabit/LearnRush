'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFromTemplate = async (template, extraData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Parse agent_prompts
      const agentPrompts = typeof template.agent_prompts === 'string'
        ? JSON.parse(template.agent_prompts)
        : template.agent_prompts

      const tools = typeof template.tools === 'string'
        ? JSON.parse(template.tools)
        : template.tools

      const agents = [
        'classifier', 'researcher', 'qualifier', 'responder', 'executor'
      ].map((role, index) => ({
        role,
        system_prompt: agentPrompts[role] || '',
        tools: tools || [],
        order_index: index + 1
      }))

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: extraData.name || template.name,
          business_context: extraData.business_context || '',
          trigger_channel: extraData.trigger_channel || 'gmail',
          template_id: template.id,
          agents
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      return data
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    createFromTemplate,
    refetch: fetchTemplates
  }
}