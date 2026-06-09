'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ExternalLink, Check } from 'lucide-react'

export default function SheetsConfig({ workflowId, currentSheetsId }) {
  const [sheetsId, setSheetsId] = useState(currentSheetsId || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const getToken = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    return session?.access_token
  }

  const handleSave = async () => {
    if (!sheetsId.trim()) {
      toast.error('Please enter a Google Sheet ID')
      return
    }

    setSaving(true)

    try {
      const token = await getToken()

      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sheets_id: sheetsId.trim()
        })
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast.success('Google Sheet connected!')
      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 3000)
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[#a0a0b8] text-xs">
        After every execution, details will be automatically appended to your
        Google Sheet.
      </p>

      <div>
        <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">
          Google Sheet ID
        </label>

        <input
          type="text"
          value={sheetsId}
          onChange={(e) => setSheetsId(e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OdiFi2h7E"
          className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
        />

        <p className="text-[#4e4e6e] text-xs mt-1">
          Copy from your Sheet URL:
          {' '}
          docs.google.com/spreadsheets/d/
          <span className="text-accent">THIS_PART</span>
          /edit
        </p>
      </div>

      {sheetsId && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${sheetsId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-accent text-xs hover:underline"
        >
          <ExternalLink size={12} />
          Open Sheet
        </a>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <Check size={14} />
        ) : null}

        {saving ? 'Saving...' : saved ? 'Saved!' : 'Connect Sheet'}
      </button>
    </div>
  )
}