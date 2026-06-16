'use client'

import { useState } from 'react'
import { Eye, EyeOff, RotateCcw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PROMPT_TEMPLATES } from '@/config/agentConfig'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export function PromptEditor({ agentRole, value, onChange }) {
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const template = PROMPT_TEMPLATES[agentRole]

  function handleReset() {
    if (!template) return
    if (!confirm('Reset to default prompt? Current changes will be lost.')) return
    onChange(template.prompt)
    toast.success('Prompt reset to default')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = value?.trim().split(/\s+/).filter(Boolean).length ?? 0

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex-1">
          System Prompt
        </label>
        <span className="text-xs text-gray-400">{wordCount} words</span>
        <button
          onClick={() => setPreview(p => !p)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title={preview ? 'Edit mode' : 'Preview mode'}
        >
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Copy prompt"
        >
          {copied
            ? <Check className="w-3.5 h-3.5 text-green-500" />
            : <Copy className="w-3.5 h-3.5" />
          }
        </button>
        {template && (
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Template selector */}
      {template && (
        <div className="flex items-center gap-2 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <span className="text-xs text-indigo-700">
            Default template: <strong>{template.name}</strong>
          </span>
          <button
            onClick={() => onChange(template.prompt)}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Apply default →
          </button>
        </div>
      )}

      {/* Editor / Preview */}
      {preview ? (
        <div className="w-full min-h-[160px] px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
          {value || <span className="text-gray-400 italic">No prompt set</span>}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={8}
          placeholder="Enter system prompt for this agent..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
        />
      )}
    </div>
  )
}