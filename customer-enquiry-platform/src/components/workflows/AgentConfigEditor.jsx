'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, AlertTriangle } from 'lucide-react'
import { RETRY_POLICIES } from '@/constants/workflowConstants'

const AGENT_COLORS = {
  classifier: 'bg-blue-500',
  researcher: 'bg-purple-500',
  qualifier: 'bg-yellow-500',
  responder: 'bg-green-500',
  executor: 'bg-red-500',
}

function AgentConfig({ agent, index, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const color = AGENT_COLORS[agent.role] || 'bg-accent'

  const updateRetry = (field, value) => {
    onChange({
      ...agent,
      retry_policy: {
        ...(agent.retry_policy || { max_retries: 3 }),
        [field]: value
      }
    })
  }

  return (
    <div className="bg-[#0f0f17] border border-[#2e2e4e] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#16213e] transition-colors"
      >
        <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {index + 1}
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium text-sm capitalize">{agent.role} Agent</p>
          <p className="text-[#4e4e6e] text-xs">
            {agent.retry_policy?.max_retries || 3} retries •
            {agent.fallback_prompt ? ' has fallback' : ' no fallback'}
          </p>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-[#a0a0b8]" />
          : <ChevronDown size={14} className="text-[#a0a0b8]" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2e2e4e] space-y-4">

          {/* System Prompt */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-[#a0a0b8] mb-1.5">
              System Prompt
            </label>
            <textarea
              value={agent.system_prompt || ''}
              onChange={e => onChange({ ...agent, system_prompt: e.target.value })}
              rows={5}
              className="w-full bg-[#1a1a2e] border border-[#2e2e4e] rounded-lg px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Retry Policy */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <RotateCcw size={13} className="text-[#a0a0b8]" />
              <label className="text-xs font-medium text-[#a0a0b8]">
                Retry Policy
              </label>
            </div>
            <select
              value={agent.retry_policy?.max_retries || 3}
              onChange={e => updateRetry('max_retries', parseInt(e.target.value))}
              className="w-full bg-[#1a1a2e] border border-[#2e2e4e] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-accent"
            >
              {RETRY_POLICIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Fallback Prompt */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={13} className="text-[#a0a0b8]" />
              <label className="text-xs font-medium text-[#a0a0b8]">
                Fallback Prompt
              </label>
            </div>
            <p className="text-[#4e4e6e] text-xs mb-2">
              What this agent should do when data is missing or an error occurs
            </p>
            <textarea
              value={agent.fallback_prompt || ''}
              onChange={e => onChange({ ...agent, fallback_prompt: e.target.value })}
              placeholder={`e.g. If you cannot find relevant information, respond with: {"relevant_info": "No specific information found, providing general response", "response_points": ["general point"], "confidence": 0.5}`}
              rows={3}
              className="w-full bg-[#1a1a2e] border border-[#2e2e4e] rounded-lg px-3 py-2.5 text-white placeholder-[#4e4e6e] text-xs font-mono focus:outline-none focus:border-accent resize-none"
            />
          </div>

        </div>
      )}
    </div>
  )
}

export default function AgentConfigEditor({ agents, onChange }) {
  const updateAgent = (index, updatedAgent) => {
    const newAgents = [...agents]
    newAgents[index] = updatedAgent
    onChange(newAgents)
  }

  return (
    <div className="space-y-2">
      {agents.map((agent, index) => (
        <AgentConfig
          key={agent.role}
          agent={agent}
          index={index}
          onChange={(updated) => updateAgent(index, updated)}
        />
      ))}
    </div>
  )
}