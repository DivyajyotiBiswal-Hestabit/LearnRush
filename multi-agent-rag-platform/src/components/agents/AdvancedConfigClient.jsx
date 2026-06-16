'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bot, GitBranch, Brain, MessageSquare, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PromptEditor } from '@/components/agents/PromptEditor'
import { RoutingRulesBuilder } from '@/components/agents/RoutingRulesBuilder'
import { MemoryManager } from '@/components/agents/MemoryManager'
import { DEBATE_PROTOCOLS } from '@/config/agentConfig'
import { cn } from '@/lib/utils/cn'

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

const TABS = [
  { id: 'prompts', label: 'System Prompts', icon: MessageSquare },
  { id: 'routing', label: 'Model Routing', icon: GitBranch },
  { id: 'debate', label: 'Debate Protocol', icon: Bot },
  { id: 'memory', label: 'Shared Memory', icon: Brain },
]

export function AdvancedConfigClient({ team }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('prompts')
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  // Agent-level state
  const [agents, setAgents] = useState(
    team.agents?.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      model_id: a.model_id,
      system_prompt: a.system_prompt ?? '',
      temperature: a.temperature ?? 0.7,
      max_tokens: a.max_tokens ?? 2048,
      routing_rules: a.routing_rules ?? [],
      response_style: a.response_style ?? 'balanced',
    })) ?? []
  )

  // Team-level state
  const [debateConfig, setDebateConfig] = useState(team.debate_config ?? {})
  const [memoryEnabled, setMemoryEnabled] = useState(team.memory_config?.enabled ?? false)

  function updateAgent(index, field, value) {
    setAgents(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const selectedAgent = agents[selectedAgentIndex]

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${team.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debate_config: debateConfig,
          memory_config: { enabled: memoryEnabled },
          agents,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Save failed')
        return
      }

      toast.success('Configuration saved!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/teams')}
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Configuration</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {team.name} · {agents.length} agents · {team.collaboration_mode} mode
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save All
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* System Prompts Tab */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Agent selector */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Agents
            </p>
            {agents.map((agent, i) => (
              <button
                key={i}
                onClick={() => setSelectedAgentIndex(i)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                  selectedAgentIndex === i
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                  <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                    {agent.role}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Prompt editor */}
          <div className="col-span-2 flex flex-col gap-4">
            {selectedAgent && (
              <>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedAgent.name}
                  </span>
                  <Badge variant={ROLE_COLORS[selectedAgent.role] ?? 'default'}>
                    {selectedAgent.role}
                  </Badge>
                </div>

                <PromptEditor
                  agentRole={selectedAgent.role}
                  value={selectedAgent.system_prompt}
                  onChange={val => updateAgent(selectedAgentIndex, 'system_prompt', val)}
                />

                {/* Temperature + max tokens */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Temperature
                      <span className="text-gray-400 ml-1 font-normal">
                        ({selectedAgent.temperature})
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={selectedAgent.temperature}
                      onChange={e => updateAgent(selectedAgentIndex, 'temperature', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Precise (0)</span>
                      <span>Creative (1)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Max Tokens</label>
                    <select
                      value={selectedAgent.max_tokens}
                      onChange={e => updateAgent(selectedAgentIndex, 'max_tokens', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value={512}>512 — Very short</option>
                      <option value={1024}>1024 — Short</option>
                      <option value={2048}>2048 — Medium</option>
                      <option value={4096}>4096 — Long</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Routing Tab */}
      {activeTab === 'routing' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Agent selector */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Agents
            </p>
            {agents.map((agent, i) => (
              <button
                key={i}
                onClick={() => setSelectedAgentIndex(i)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                  selectedAgentIndex === i
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                      {agent.role}
                    </Badge>
                    {agent.routing_rules?.length > 0 && (
                      <Badge variant="primary">
                        {agent.routing_rules.length} rules
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Rules builder */}
          <div className="col-span-2">
            {selectedAgent && (
              <RoutingRulesBuilder
                rules={selectedAgent.routing_rules}
                onChange={rules => updateAgent(selectedAgentIndex, 'routing_rules', rules)}
              />
            )}
          </div>
        </div>
      )}

      {/* Debate Tab */}
      {activeTab === 'debate' && (
        <div className="flex flex-col gap-5 max-w-xl">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-sm text-indigo-700">
              Debate protocol settings apply when this team uses <strong>Debate</strong> collaboration mode.
              Current mode: <strong>{team.collaboration_mode}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Debate Protocol
            </label>
            <div className="grid grid-cols-1 gap-3">
              {DEBATE_PROTOCOLS.map(protocol => (
                <label
                  key={protocol.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    debateConfig.protocol === protocol.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="protocol"
                    value={protocol.id}
                    checked={debateConfig.protocol === protocol.id}
                    onChange={() => setDebateConfig(prev => ({ ...prev, protocol: protocol.id }))}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{protocol.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{protocol.description}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Badge variant="default">{protocol.rounds} round{protocol.rounds > 1 ? 's' : ''}</Badge>
                      {protocol.consensusRequired && <Badge variant="success">consensus</Badge>}
                      {protocol.questionBased && <Badge variant="primary">question-based</Badge>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rounds override */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Custom Rounds (optional)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={debateConfig.rounds ?? ''}
              onChange={e => setDebateConfig(prev => ({
                ...prev,
                rounds: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              placeholder="Use protocol default"
              className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400">
              Leave empty to use the protocol's default round count
            </p>
          </div>
        </div>
      )}

      {/* Memory Tab */}
      {activeTab === 'memory' && (
        <div className="max-w-xl">
          <MemoryManager
            teamId={team.id}
            enabled={memoryEnabled}
            onToggle={() => setMemoryEnabled(e => !e)}
          />
        </div>
      )}
    </div>
  )
}