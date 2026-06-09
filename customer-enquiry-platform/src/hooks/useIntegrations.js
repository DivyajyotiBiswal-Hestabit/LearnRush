'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useIntegrations() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchIntegrations = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectGmail = async (userId) => {
    const res = await fetch('/api/integrations/gmail')
    const { authUrl } = await res.json()
    // Pass userId in state param so callback knows who to save for
    const urlWithState = authUrl + `&state=${userId}`
    window.location.href = urlWithState
  }

  const connectDrive = async (userId) => {
    const res = await fetch('/api/integrations/google-drive')
    const { authUrl } = await res.json()
    window.location.href = authUrl + `&state=${userId}`
  }

  const connectSheets = async (userId) => {
    const res = await fetch('/api/integrations/google-sheets')
    const { authUrl } = await res.json()
    window.location.href = authUrl + `&state=${userId}`
  }

  const connectWhatsApp = async (apiToken, phoneNumberId) => {
    const token = await getToken()
    const res = await fetch('/api/integrations/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        api_token: apiToken,
        phone_number_id: phoneNumberId
      })
    })
    return res.json()
  }
  const connectSlack = async (webhookUrl, channelName) => {
    const token = await getToken()
    const res = await fetch('/api/integrations/slack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ webhook_url: webhookUrl, channel_name: channelName })
    })
    return res.json()
  }

  const connectDiscord = async (webhookUrl) => {
    const token = await getToken()
    const res = await fetch('/api/integrations/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ webhook_url: webhookUrl })
    })
    return res.json()
  }

  const connectCalendar = async (userId) => {
    const res = await fetch('/api/integrations/google-calendar')
    const { authUrl } = await res.json()
    window.location.href = authUrl + `&state=${userId}`
  }


  const disconnect = async (type) => {
    const token = await getToken()
    const endpoints = {
      gmail: '/api/integrations/gmail',
      google_drive: '/api/integrations/google-drive',
      google_sheets: '/api/integrations/google-sheets',
      oogle_calendar: '/api/integrations/google-calendar',
      whatsapp: '/api/integrations/whatsapp',
      slack: '/api/integrations/slack',
      discord: '/api/integrations/discord',
    }
    await fetch(endpoints[type], {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchIntegrations()
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const getStatus = (type) => {
    const integration = integrations.find(i => i.type === type)
    return integration?.status || 'disconnected'
  }

  const getEmail = (type) => {
    const integration = integrations.find(i => i.type === type)
    return integration?.email || null
  }

  return {
    integrations,
    loading,
    connectGmail,
    connectDrive,
    connectSheets,
    connectWhatsApp,
    connectDiscord,
    connectSlack,
    connectCalendar,
    disconnect,
    getStatus,
    getEmail,
    refetch: fetchIntegrations
  }
}