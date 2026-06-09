'use client'

import { useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { useRouter } from 'next/navigation'
import {
  LayoutTemplate, ArrowRight, X,
  Mail, MessageCircle, Check,
  Zap, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const INDUSTRY_COLORS = {
  'General': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Sales': 'bg-green-500/10 text-green-400 border-green-500/20',
  'E-commerce': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Customer Service': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Retail': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

const AGENT_COLORS = {
  classifier: 'bg-blue-500',
  researcher: 'bg-purple-500',
  qualifier: 'bg-yellow-500',
  responder: 'bg-green-500',
  executor: 'bg-red-500',
}

// Template Preview Modal
function TemplatePreviewModal({ template, onClose, onUse }) {
  const [expandedAgent, setExpandedAgent] = useState(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: template.name,
    business_context: '',
    trigger_channel: 'gmail'
  })
  const [creating, setCreating] = useState(false)

  const agentPrompts = typeof template.agent_prompts === 'string'
    ? JSON.parse(template.agent_prompts)
    : template.agent_prompts

  const handleCreate = async () => {
    if (!formData.business_context) {
      toast.error('Please enter your business context')
      return
    }
    setCreating(true)
    try {
      await onUse(template, formData)
      toast.success('Workflow created from template!')
      onClose()
    } catch (error) {
      toast.error('Failed to create: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-accent border border-[#2e2e4e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e4e] flex-shrink-0">
          <div>
            <h2 className="text-accent font-bold text-lg">{template.name}</h2>
            <p className="text-accent text-s mt-0.5">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-accent hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">

          {/* Step tabs */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { num: 1, label: 'Preview' },
              { num: 2, label: 'Configure' }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    step === s.num
                      ? 'bg-accent text-white'
                      : 'bg-[#0f0f17] text-[#a0a0b8] hover:text-white'
                  }`}
                >
                  {step > s.num ? <Check size={12} /> : s.num}
                  {s.label}
                </button>
                {i < 1 && <ArrowRight size={12} className="text-[#4e4e6e]" />}
              </div>
            ))}
          </div>

          {/* Step 1 — Preview */}
          {step === 1 && (
            <div className="space-y-4">

              {/* Template info */}
              <div className="bg-[#0f0f17] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LayoutTemplate size={22} className="text-accent" />
                </div>
                <div>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border mb-1 ${
                    INDUSTRY_COLORS[template.industry] || 'bg-[#2e2e4e] text-[#a0a0b8]'
                  }`}>
                    {template.industry}
                  </div>
                  <p className="text-acent text-s">{template.description}</p>
                </div>
              </div>

              {/* Agent pipeline preview */}
              <div>
                <p className="text-white text-sm font-medium mb-3">Agent Pipeline</p>
                <div className="space-y-2">
                  {Object.keys(agentPrompts).map((role, i) => (
                    <div key={role} className="bg-[#0f0f17] border border-[#2e2e4e] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedAgent(expandedAgent === role ? null : role)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[#16213e] transition-colors"
                      >
                        <div className={`w-7 h-7 ${AGENT_COLORS[role]} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {i + 1}
                        </div>
                        <span className="text-white text-sm font-medium capitalize flex-1 text-left">
                          {role} Agent
                        </span>
                        {expandedAgent === role
                          ? <ChevronUp size={14} className="text-[#a0a0b8]" />
                          : <ChevronDown size={14} className="text-[#a0a0b8]" />
                        }
                      </button>
                      {expandedAgent === role && (
                        <div className="px-3 pb-3 border-t border-[#2e2e4e]">
                          <pre className="text-[#a0a0b8] text-xs mt-3 whitespace-pre-wrap leading-relaxed">
                            {agentPrompts[role]}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Use This Template
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 — Configure */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">
                  Business Context
                </label>
                <textarea
                  value={formData.business_context}
                  onChange={e => setFormData({ ...formData, business_context: e.target.value })}
                  placeholder="Describe your business. e.g. We are an online clothing store selling ethnic wear. Our return policy is 30 days..."
                  rows={4}
                  className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-3 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm resize-none"
                />
                <p className="text-[#4e4e6e] text-xs mt-1">
                  This is injected into all agents so they understand your business
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
                        <Icon size={18} className={channel.color} />
                        <span className="text-white font-medium text-sm">{channel.label}</span>
                        {formData.trigger_channel === channel.value && (
                          <Check size={14} className="text-accent ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !formData.business_context}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap size={15} />
                  )}
                  {creating ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// Template Card
function TemplateCard({ template, onPreview }) {
  const agentPrompts = typeof template.agent_prompts === 'string'
    ? JSON.parse(template.agent_prompts)
    : template.agent_prompts

  const agentCount = Object.keys(agentPrompts).length

  return (
    <div className="bg-[#F0FFF0] border border-[#2e2e4e] rounded-xl p-5 hover:border-[#4e4e6e] transition-all group">

      {/* Icon + industry */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center">
          <LayoutTemplate size={20} className="text-accent" />
        </div>
        <span className={`text-sm px-2 py-0.5 rounded-full border ${
          INDUSTRY_COLORS[template.industry] || 'bg-[#2e2e4e] text-[#a0a0b8] border-[#2e2e4e]'
        }`}>
          {template.industry}
        </span>
      </div>

      {/* Name + description */}
      <h3 className="text-accent font-semibold text-m mb-2">{template.name}</h3>
      <p className="text-accent text-s leading-relaxed mb-4 line-clamp-2">
        {template.description}
      </p>

      {/* Agent pills */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {Object.keys(agentPrompts).map((role, i) => (
          <div
            key={role}
            className={`w-6 h-6 ${AGENT_COLORS[role]} rounded-full flex items-center justify-center text-white text-xs font-bold`}
            title={`${role} agent`}
          >
            {role.charAt(0).toUpperCase()}
          </div>
        ))}
        <span className="text-[#4e4e6e] text-xs ml-1">{agentCount} agents</span>
      </div>

      {/* Actions */}
      <button
        onClick={() => onPreview(template)}
        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Zap size={14} />
        Use Template
      </button>
    </div>
  )
}

export default function TemplatesPage() {
  const { templates, loading, createFromTemplate } = useTemplates()
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [filter, setFilter] = useState('All')
  const router = useRouter()

  const industries = ['All', ...new Set(templates.map(t => t.industry))]

  const filtered = filter === 'All'
    ? templates
    : templates.filter(t => t.industry === filter)

  const handleUseTemplate = async (template, formData) => {
    const result = await createFromTemplate(template, formData)
    router.push('/dashboard/workflows')
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-accent text-sm mt-1">
          Pre-built workflows to get started instantly
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {industries.map(industry => (
          <button
            key={industry}
            onClick={() => setFilter(industry)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === industry
                ? 'bg-accent text-white'
                : 'bg-surface border border-[#2e2e4e] text-accent hover:text-white'
            }`}
          >
            {industry}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-[#2e2e4e] rounded-xl p-5 animate-pulse">
              <div className="w-11 h-11 bg-[#2e2e4e] rounded-xl mb-4" />
              <div className="w-3/4 h-4 bg-[#2e2e4e] rounded mb-2" />
              <div className="w-full h-8 bg-[#2e2e4e] rounded mb-4" />
              <div className="w-full h-8 bg-[#2e2e4e] rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <LayoutTemplate size={28} className="text-[#4e4e6e] mx-auto mb-3" />
          <p className="text-white font-medium">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setSelectedTemplate}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}

    </div>
  )
}