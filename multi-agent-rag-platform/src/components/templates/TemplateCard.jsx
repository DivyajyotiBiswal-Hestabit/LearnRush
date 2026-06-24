'use client'

import { useState } from 'react'
import { Bot, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DIFFICULTY_COLORS } from '@/config/templates'
import { AVAILABLE_MODELS } from '@/config/models'
import { cn } from '@/lib/utils/cn'

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

const MODE_COLORS = {
  sequential: 'blue',
  debate: 'warning',
  hierarchical: 'purple',
}

export function TemplateCard({ template, onUse }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUse() {
    setLoading(true)
    try {
      await onUse(template)
    } finally {
      setLoading(false)
    }
  }

  const modelName = (modelId) =>
    AVAILABLE_MODELS.find(m => m.id === modelId)?.name ?? modelId.replace(':latest', '')

  return (
    <div className={cn(
      'bg-[#ACE1AF] rounded-xl border border-gray-200 overflow-hidden h-70 w-100',
      'hover:border-indigo-200 hover:shadow-sm transition-all'
    )}>
      {/* Header */}
      <div className="p-8">
        <div className="flex items-start gap-5">

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-semibold text-[#013220]">
                {template.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={DIFFICULTY_COLORS[template.difficulty] ?? 'default'}>
                {template.difficulty}
              </Badge>
              <Badge variant={MODE_COLORS[template.collaboration_mode] ?? 'default'}>
                {template.collaboration_mode}
              </Badge>
              <Badge variant="default">{template.category}</Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#013220] mt-3 leading-relaxed">
          {template.description}
        </p>

        {/* Use case hint */}
        <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Example: </span>
            {template.useCase}
          </p>
        </div>

        {/* Agent summary */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {template.agents.map((agent, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100"
            >
              <Bot className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{agent.name}</span>
              <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                {agent.role}
              </Badge>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={handleUse}
            loading={loading}
            className="flex-1 bg-[#013220] mt-9"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Use Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Agent Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Agent Configuration
          </p>
          {template.agents.map((agent, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {agent.name}
                </span>
                <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                  {agent.role}
                </Badge>
                <span className="ml-auto text-xs text-gray-400">
                  {modelName(agent.model_id)}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}