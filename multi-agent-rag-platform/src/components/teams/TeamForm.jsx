'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AgentForm } from '@/components/teams/AgentForm'
import { AGENT_ROLE_DEFAULTS, DEFAULT_MODEL } from '@/config/models'
import { COLLABORATION_MODES } from '@/config/agents'
import { toast } from 'sonner'


function createDefaultAgent(role = 'researcher', index = 0) {
  const prompts = {
    researcher: "You are a thorough researcher. Find and present the most relevant information from the provided context. Be factual and cite sources.",
    critic: "You are a critical analyst. Review findings and identify gaps or inconsistencies. Be constructive and specific.",
    synthesizer: "You are a skilled synthesizer. Combine all agent outputs into a clear, well-structured final answer backed by source material.",
    analyst: "You are a data analyst. Extract patterns, insights and key metrics from the provided information.",
    general: "You are a helpful AI assistant. Answer the query as accurately as possible using the provided context.",
  }

  return {
    name: role.charAt(0).toUpperCase() + role.slice(1),
    role,
    description: '',
    model_id: AGENT_ROLE_DEFAULTS[role] ?? DEFAULT_MODEL,
    system_prompt: prompts[role] ?? '',
    response_style: 'balanced',
  }
}

export function TeamForm({ initialData = null, onSuccess }) {
  const router = useRouter()
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    research_domain: initialData?.research_domain ?? '',
    collaboration_mode: initialData?.collaboration_mode ?? 'sequential',
  })

  const [agents, setAgents] = useState(
    initialData?.agents?.length
      ? initialData.agents.map(a => ({
          name: a.name,
          role: a.role,
          description: a.description ?? '',
          model_id: a.model_id,
          system_prompt: a.system_prompt ?? '',
          response_style: a.response_style ?? 'balanced',
        }))
      : [
          createDefaultAgent('researcher', 0),
          createDefaultAgent('critic', 1),
          createDefaultAgent('synthesizer', 2),
        ]
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFormField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleAgentChange(index, updatedAgent) {
    setAgents(prev => prev.map((a, i) => i === index ? updatedAgent : a))
  }

  function handleAddAgent() {
    setAgents(prev => [...prev, createDefaultAgent('general', prev.length)])
  }

  function handleRemoveAgent(index) {
    setAgents(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }
    if (agents.length === 0) {
      setError('Add at least one agent')
      return
    }
    if (agents.some(a => !a.name.trim())) {
      setError('All agents must have a name')
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? `/api/teams/${initialData.id}` : '/api/teams'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, agents }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      if (onSuccess) {
        onSuccess(data.team)
      } else {
        toast.success(isEditing ? 'Team updated!' : 'Team created!')
        router.push('/teams')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Team Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Team Details
        </h2>

        <Input
          label="Team Name"
          placeholder="e.g. Research Analysis Team"
          value={formData.name}
          onChange={e => handleFormField('name', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Research Domain (optional)"
            placeholder="e.g. Medical Research"
            value={formData.research_domain}
            onChange={e => handleFormField('research_domain', e.target.value)}
          />
          <Select
            label="Collaboration Mode"
            value={formData.collaboration_mode}
            onChange={e => handleFormField('collaboration_mode', e.target.value)}
          >
            {COLLABORATION_MODES.map(m => (
              <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            rows={2}
            placeholder="What will this team research?"
            value={formData.description}
            onChange={e => handleFormField('description', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Agents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Agents ({agents.length})
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAgent}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Agent
          </Button>
        </div>

        {agents.map((agent, index) => (
          <AgentForm
            key={index}
            agent={agent}
            index={index}
            onChange={handleAgentChange}
            onRemove={handleRemoveAgent}
            canRemove={agents.length > 1}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading} size="lg">
          {isEditing ? 'Save Changes' : 'Create Team'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push('/teams')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}