'use client'

import { useState } from 'react'
import { Bot, Zap, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DIFFICULTY_COLORS } from '@/config/templates'
import { AVAILABLE_MODELS } from '@/config/models'

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

export function TemplatePreviewModal({ template, isOpen, onClose, onConfirm, loading }) {
  const [customName, setCustomName] = useState(template?.name ?? '')

  if (!template) return null

  function handleConfirm() {
    onConfirm(template, customName || template.name)
  }

  const modelName = (modelId) =>
    AVAILABLE_MODELS.find(m => m.id === modelId)?.name ?? modelId.replace(':latest', '')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Use Template: ${template.name}`}
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Template overview */}
        <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-gray-900">
                {template.name}
              </span>
              <Badge variant={DIFFICULTY_COLORS[template.difficulty] ?? 'default'}>
                {template.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        </div>

        {/* Custom name */}
        <Input
          label="Team Name (customize or keep default)"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder={template.name}
        />

        {/* Collaboration mode */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            <span className="font-medium capitalize">{template.collaboration_mode} mode</span>
            {' — '}
            {template.collaboration_mode === 'sequential' && 'Agents work one after another, each building on the previous output.'}
            {template.collaboration_mode === 'debate' && 'Agents independently analyze then respond to each other before synthesizing.'}
            {template.collaboration_mode === 'hierarchical' && 'Lead agent delegates subtasks to specialist agents.'}
          </p>
        </div>

        {/* Agents preview */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {template.agents.length} Agents
          </p>
          <div className="flex flex-col gap-2">
            {template.agents.map((agent, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {agent.name}
                    </span>
                    <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                      {agent.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{agent.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-gray-600">
                    {modelName(agent.model_id)}
                  </p>
                  <p className="text-xs text-gray-400">{agent.response_style}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example use case */}
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-xs font-medium text-green-800 mb-1">💡 How to use</p>
          <p className="text-xs text-green-700">{template.useCase}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleConfirm}
            loading={loading}
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Team from Template
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}