'use client'

import { useState } from 'react'
import { Database, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { UploadZone } from '@/components/knowledge-base/UploadZone'
import { DocumentList } from '@/components/knowledge-base/DocumentList'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { RAGSettings } from '@/components/knowledge-base/RAGSettings'
import { RetrievalTester } from '@/components/knowledge-base/RetrievalTester'


function CreateKBModal({ isOpen, onClose, teams, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, team_id: teamId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onCreate(data.knowledgeBase)
      setName('')
      setDescription('')
      setTeamId('')
      toast.success('Knowledge base created!')

      onClose()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Knowledge Base" size="sm">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        <Input
          label="Name"
          placeholder="e.g. Research Papers"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What documents will this contain?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        {teams.length > 0 && (
          <Select
            label="Link to Team (optional)"
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
          >
            <option value="">No team</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        )}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Create
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function KBCard({ kb, onDelete, onDocumentDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [documents, setDocuments] = useState(kb.documents ?? [])
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteKB() {
    if (!confirm(`Delete "${kb.name}" and all its documents?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/knowledge-base/${kb.id}`, { method: 'DELETE' })
      onDelete(kb.id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  function handleDocumentDelete(docId) {
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  async function refreshDocuments() {
    const res = await fetch('/api/knowledge-base')
    const data = await res.json()
    const updated = data.knowledgeBases?.find(k => k.id === kb.id)
    if (updated?.documents) setDocuments(updated.documents)
  }

  const readyCount = documents.filter(d => d.status === 'ready').length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{kb.name}</h3>
            <Badge variant="success">{readyCount} ready</Badge>
            {documents.length - readyCount > 0 && (
              <Badge variant="warning">{documents.length - readyCount} processing</Badge>
            )}
          </div>
          {kb.description && (
            <p className="text-sm text-gray-500 mt-0.5">{kb.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {documents.length} documents · Created {formatDate(kb.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleDeleteKB}
            disabled={deleting}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-5">
          <UploadZone
            knowledgeBaseId={kb.id}
            onUploadComplete={refreshDocuments}
          />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Documents
            </p>
            <DocumentList
              documents={documents}
              onDelete={handleDocumentDelete}
            />
            <RAGSettings knowledgeBaseId={kb.id} />
            <RetrievalTester knowledgeBaseId={kb.id} />

          </div>
        </div>
      )}
    </div>
  )
}

export function KnowledgeBaseClient({ initialKBs, teams }) {
  const [kbs, setKBs] = useState(initialKBs)
  const [modalOpen, setModalOpen] = useState(false)

  function handleCreate(newKB) {
    setKBs(prev => [{ ...newKB, documents: [] }, ...prev])
  }

  function handleDelete(kbId) {
    setKBs(prev => prev.filter(k => k.id !== kbId))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload documents for your agents to research
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Knowledge Base
        </Button>
      </div>

      {/* List */}
      {kbs.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No knowledge bases yet"
          description="Create a knowledge base and upload documents for your agents to use."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {kbs.map(kb => (
            <KBCard
              key={kb.id}
              kb={kb}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateKBModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teams={teams}
        onCreate={handleCreate}
      />
    </div>
  )
}