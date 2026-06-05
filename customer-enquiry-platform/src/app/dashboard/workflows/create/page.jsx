'use client'

import { useState } from 'react'
import { useWorkflows } from '@/hooks/useWorkflows'
import { useRouter } from 'next/navigation'
import { AGENT_ROLES, DEFAULT_AGENT_PROMPTS } from '@/constants/agentTemplates'
import {
  ArrowLeft, ArrowRight, Check,
  Mail, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CreateWorkflowPage() {
  const router = useRouter()
  const { createWorkflow } = useWorkflows()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    business_context: '',
    trigger_channel: 'gmail',
    agents: AGENT_ROLES.map(agent => ({
      role: agent.role,
      system_prompt: DEFAULT_AGENT_PROMPTS[agent.role],
      tools: agent.tools
    }))
  })

  const [expandedAgent, setExpandedAgent] = useState('classifier')

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter a workflow name')
      return
    }
    if (!formData.business_context) {
      toast.error('Please enter your business context')
      return
    }

    setSaving(true)
    try {
      await createWorkflow(formData)
      toast.success('Workflow created successfully!')
      router.push('/dashboard/workflows')
    } catch (error) {
      toast.error('Failed to create workflow: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateAgentPrompt = (role, prompt) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.role === role ? { ...a, system_prompt: prompt } : a
      )
    }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/workflows"
          className="p-2 text-[#a0a0b8] hover:text-white hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Workflow</h1>
          <p className="text-[#a0a0b8] text-sm mt-0.5">
            Set up your multi-agent automation pipeline
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Agent Prompts' },
          { num: 3, label: 'Review' }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === s.num
                ? 'bg-accent text-white'
                : step > s.num
                  ? 'bg-success/20 text-success'
                  : 'bg-surface text-[#a0a0b8]'
            }`}>
              {step > s.num ? <Check size={12} /> : s.num}
              {s.label}
            </div>
            {i < 2 && <div className="w-8 h-px bg-[#2e2e4e]" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">
              Workflow Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Customer Support Handler"
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">
              Business Context
            </label>
            <textarea
              value={formData.business_context}
              onChange={e => setFormData({ ...formData, business_context: e.target.value })}
              placeholder="Describe your business. e.g. We are an online clothing store selling ethnic wear. We ship within 5-7 business days. Our return policy allows returns within 30 days."
              rows={4}
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-3 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm resize-none"
            />
            <p className="text-[#4e4e6e] text-xs mt-1">
              This context is injected into all agents so they understand your business
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-3">
              Trigger Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-400' },
                { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' }
              ].map(channel => {
                const Icon = channel.icon
                return (
                  <button
                    key={channel.value}
                    onClick={() => setFormData({ ...formData, trigger_channel: channel.value })}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      formData.trigger_channel === channel.value
                        ? 'border-accent bg-accent/10'
                        : 'border-[#2e2e4e] hover:border-[#4e4e6e]'
                    }`}
                  >
                    <Icon size={20} className={channel.color} />
                    <span className="text-white font-medium text-sm">{channel.label}</span>
                    {formData.trigger_channel === channel.value && (
                      <Check size={14} className="text-accent ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.name || !formData.business_context}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            Next: Configure Agents
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2 — Agent Prompts */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-surface border border-[#2e2e4e] rounded-xl p-4 mb-2">
            <p className="text-[#a0a0b8] text-sm">
              Each agent has a default prompt. Customize them for your specific business needs.
              The <span className="text-white">business context</span> you provided will be automatically injected.
            </p>
          </div>

          {AGENT_ROLES.map((agentRole, index) => (
            <div key={agentRole.role} className="bg-surface border border-[#2e2e4e] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedAgent(
                  expandedAgent === agentRole.role ? null : agentRole.role
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-[#16213e] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 ${agentRole.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{agentRole.label}</p>
                    <p className="text-[#a0a0b8] text-xs">{agentRole.description}</p>
                  </div>
                </div>
                {expandedAgent === agentRole.role
                  ? <ChevronUp size={16} className="text-[#a0a0b8]" />
                  : <ChevronDown size={16} className="text-[#a0a0b8]" />
                }
              </button>

              {expandedAgent === agentRole.role && (
                <div className="px-4 pb-4 border-t border-[#2e2e4e]">
                  <label className="block text-xs font-medium text-[#a0a0b8] mt-3 mb-1.5">
                    System Prompt
                  </label>
                  <textarea
                    value={formData.agents.find(a => a.role === agentRole.role)?.system_prompt || ''}
                    onChange={e => updateAgentPrompt(agentRole.role, e.target.value)}
                    rows={8}
                    className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-accent resize-none"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              Next: Review
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-5">Review & Create</h2>

          <div className="space-y-4 mb-6">
            <div className="bg-[#0f0f17] rounded-lg p-4">
              <p className="text-[#a0a0b8] text-xs mb-1">Workflow Name</p>
              <p className="text-white font-medium">{formData.name}</p>
            </div>

            <div className="bg-[#0f0f17] rounded-lg p-4">
              <p className="text-[#a0a0b8] text-xs mb-1">Trigger Channel</p>
              <p className="text-white font-medium capitalize">{formData.trigger_channel}</p>
            </div>

            <div className="bg-[#0f0f17] rounded-lg p-4">
              <p className="text-[#a0a0b8] text-xs mb-1">Business Context</p>
              <p className="text-white text-sm">{formData.business_context}</p>
            </div>

            <div className="bg-[#0f0f17] rounded-lg p-4">
              <p className="text-[#a0a0b8] text-xs mb-2">Agent Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap">
                {AGENT_ROLES.map((agent, i) => (
                  <div key={agent.role} className="flex items-center gap-2">
                    <span className={`px-2 py-1 ${agent.color} bg-opacity-20 rounded text-xs text-white font-medium`}>
                      {agent.label}
                    </span>
                    {i < AGENT_ROLES.length - 1 && (
                      <ArrowRight size={12} className="text-[#4e4e6e]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Create Workflow
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}