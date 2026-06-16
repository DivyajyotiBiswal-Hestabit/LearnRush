'use client'

import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { toast } from 'sonner'
import { MEMORY_TYPES } from '@/config/agentConfig'
import { formatDate } from '@/lib/utils/format'

const TYPE_COLORS = {
  fact: 'blue',
  preference: 'purple',
  context: 'success',
  summary: 'warning',
}

export function MemoryManager({ teamId, enabled, onToggle }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState('fact')
  const [newImportance, setNewImportance] = useState(5)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  async function fetchMemories() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/memory`)
      const data = await res.json()
      setMemories(data.memories ?? [])
    } catch (err) {
      toast.error('Failed to load memories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teamId && enabled) {
      fetchMemories()
    }
  }, [teamId, enabled])

  async function handleAdd() {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          memory_type: newType,
          importance: newImportance,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add memory')
        return
      }
      setMemories(prev => [data.memory, ...prev])
      setNewContent('')
      setShowAddForm(false)
      toast.success('Memory added')
    } catch {
      toast.error('Failed to add memory')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(memoryId) {
    try {
      await fetch(`/api/teams/${teamId}/memory?memoryId=${memoryId}`, {
        method: 'DELETE',
      })
      setMemories(prev => prev.filter(m => m.id !== memoryId))
      toast.success('Memory removed')
    } catch {
      toast.error('Failed to remove memory')
    }
  }

  async function handleClearAll() {
    if (!confirm('Clear all memories for this team?')) return
    try {
      await fetch(`/api/teams/${teamId}/memory`, { method: 'DELETE' })
      setMemories([])
      toast.success('All memories cleared')
    } catch {
      toast.error('Failed to clear memories')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          <div>
            <p className="text-sm font-medium text-gray-800">Shared Memory</p>
            <p className="text-xs text-gray-500">
              Agents remember facts across sessions
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Memory list header */}
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">
              Stored Memories ({memories.length})
            </p>
            <button
              onClick={fetchMemories}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Clear all
              </button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(f => !f)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col gap-3">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="What should the agents remember?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
              />
              <div className="flex gap-2">
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white flex-1"
                >
                  {MEMORY_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Importance
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={e => setNewImportance(parseInt(e.target.value))}
                    className="w-14 text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-center"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} loading={adding} className="flex-1">
                  Save Memory
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Memory list */}
          {memories.length === 0 && !loading && (
            <p className="text-xs text-gray-400 text-center py-4">
              No memories stored yet. They're created automatically after each session, or add them manually above.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {memories.map(memory => (
              <div
                key={memory.id}
                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={TYPE_COLORS[memory.memory_type] ?? 'default'}>
                      {memory.memory_type}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Importance: {memory.importance}/10
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDate(memory.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {memory.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}