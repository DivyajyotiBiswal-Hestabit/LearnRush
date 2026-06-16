'use client'

import { useState } from 'react'
import { Settings, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export function RAGSettings({ knowledgeBaseId, initialSettings = {} }) {
  const [settings, setSettings] = useState({
    vector_weight: initialSettings.vector_weight ?? 0.7,
    keyword_weight: initialSettings.keyword_weight ?? 0.3,
    top_k: initialSettings.top_k ?? 5,
    similarity_threshold: initialSettings.similarity_threshold ?? 0.3,
    chunk_size: initialSettings.chunk_size ?? 1200,
    use_llm_rerank: initialSettings.use_llm_rerank ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  function updateSetting(key, value) {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }

      // Auto-balance vector/keyword weights
      if (key === 'vector_weight') {
        updated.keyword_weight = Math.round((1 - value) * 10) / 10
      } else if (key === 'keyword_weight') {
        updated.vector_weight = Math.round((1 - value) * 10) / 10
      }

      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/knowledge-base/${knowledgeBaseId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error('Save failed')
      toast.success('RAG settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Settings className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">RAG Retrieval Settings</span>
        <span className="ml-auto text-xs text-gray-400">
          {open ? 'Hide' : 'Configure'}
        </span>
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-1">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Hybrid search combines vector similarity (semantic) and BM25 keyword matching.
              Adjust weights to tune retrieval for your documents.
            </p>
          </div>

          <SettingRow
            label="Vector Weight"
            description={`Semantic similarity weight (currently ${settings.vector_weight})`}
          >
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.vector_weight}
                onChange={e => updateSetting('vector_weight', parseFloat(e.target.value))}
                className="w-24 accent-indigo-600"
              />
              <span className="text-sm font-mono w-8">{settings.vector_weight}</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Keyword Weight"
            description={`BM25 keyword weight (currently ${settings.keyword_weight})`}
          >
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.keyword_weight}
                onChange={e => updateSetting('keyword_weight', parseFloat(e.target.value))}
                className="w-24 accent-indigo-600"
              />
              <span className="text-sm font-mono w-8">{settings.keyword_weight}</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Top K Chunks"
            description="Number of chunks to retrieve per query"
          >
            <select
              value={settings.top_k}
              onChange={e => updateSetting('top_k', parseInt(e.target.value))}
              className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              {[3, 5, 8, 10, 15].map(k => (
                <option key={k} value={k}>{k} chunks</option>
              ))}
            </select>
          </SettingRow>

          <SettingRow
            label="Similarity Threshold"
            description="Minimum relevance score to include a chunk"
          >
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={settings.similarity_threshold}
                onChange={e => updateSetting('similarity_threshold', parseFloat(e.target.value))}
                className="w-24 accent-indigo-600"
              />
              <span className="text-sm font-mono w-8">{settings.similarity_threshold}</span>
            </div>
          </SettingRow>

          <SettingRow
            label="LLM Reranking"
            description="Use AI to rerank chunks (slower but more accurate)"
          >
            <button
              onClick={() => updateSetting('use_llm_rerank', !settings.use_llm_rerank)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.use_llm_rerank ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.use_llm_rerank ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </SettingRow>

          <div className="pt-3">
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}