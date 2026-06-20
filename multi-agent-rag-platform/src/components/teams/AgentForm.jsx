import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AVAILABLE_MODELS } from '@/config/models'
import { cn } from '@/lib/utils/cn'

const ROLE_OPTIONS = [
  { value: 'researcher', label: 'Researcher', color: 'primary' },
  { value: 'critic', label: 'Critic', color: 'danger' },
  { value: 'synthesizer', label: 'Synthesizer', color: 'success' },
  { value: 'analyst', label: 'Analyst', color: 'purple' },
  { value: 'general', label: 'General', color: 'default' },
]

const STYLE_OPTIONS = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' }, 
  { value: 'detailed', label: 'Detailed' },
]

const DEFAULT_PROMPTS = {
  researcher: "You are a thorough researcher. Find and present the most relevant information from the provided context. Be factual and cite sources.",
  critic: "You are a critical analyst. Review findings and identify gaps, inconsistencies, or areas that need further investigation. Be constructive.",
  synthesizer: "You are a skilled synthesizer. Combine all agent outputs into a clear, well-structured final answer backed by source material.",
  analyst: "You are a data analyst. Extract patterns, insights and key metrics from the information provided. Be precise and structured.",
  general: "You are a helpful AI assistant. Answer the query as accurately as possible using the provided context.",
}

export function AgentForm({ agent, index, onChange, onRemove, canRemove }) {
  const [expanded, setExpanded] = useState(true)

  function handleField(field, value) {
    onChange(index, { ...agent, [field]: value })
  }

  function handleRoleChange(role) {
    onChange(index, {
      ...agent,
      role,
      system_prompt: agent.system_prompt || DEFAULT_PROMPTS[role] || '',
    })
  }

  const roleInfo = ROLE_OPTIONS.find(r => r.value === agent.role)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Agent Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
            {index + 1}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {agent.name || `Agent ${index + 1}`}
            </p>
            {roleInfo && (
              <Badge variant={roleInfo.color} className="mt-0.5">
                {roleInfo.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(index) }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Agent Fields */}
      {expanded && (
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Agent Name"
              placeholder="e.g. Research Agent"
              value={agent.name}
              onChange={e => handleField('name', e.target.value)}
            />
            <Select
              label="Role"
              value={agent.role}
              onChange={e => handleRoleChange(e.target.value)}
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Model"
              value={agent.model_id}
              onChange={e => handleField('model_id', e.target.value)}
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
            <Select
              label="Response Style"
              value={agent.response_style}
              onChange={e => handleField('response_style', e.target.value)}
            >
              {STYLE_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Description (optional)"
            placeholder="What does this agent do?"
            value={agent.description}
            onChange={e => handleField('description', e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              System Prompt
            </label>
            <textarea
              rows={3}
              value={agent.system_prompt}
              onChange={e => handleField('system_prompt', e.target.value)}
              placeholder="Instructions for this agent..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Need useState import at top — fix:
import { useState } from 'react'