'use client'

import { useState } from 'react'
import { FileText, Image, Trash2, CheckCircle, AlertCircle, Clock, Loader } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/format'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    variant: 'default', icon: Clock },
  processing: { label: 'Processing', variant: 'warning', icon: Loader },
  ready:      { label: 'Ready',      variant: 'success', icon: CheckCircle },
  failed:     { label: 'Failed',     variant: 'danger',  icon: AlertCircle },
}

const CONTENT_TYPE_COLORS = {
  text:    '#2563EB',
  image:   '#7C3AED',
  table:   '#D97706',
  chart:   '#059669',
  scanned: '#DC2626',
}

// ── Moved OUTSIDE DocumentList so it's a proper top-level component ──────
function ContentTypeBadges({ doc }) {
  const types = doc.content_types ?? []

  if (!types.length && !doc.ocr_used && !doc.vision_model_used) return null

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {types.map(type => {
        const color = CONTENT_TYPE_COLORS[type]
        if (!color) return null
        return (
          <span key={type} style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, padding: '1px 5px', borderRadius: 3,
            background: `${color}20`, color,
            border: `1px solid ${color}40`,
          }}>
            {type}
          </span>
        )
      })}

      {doc.ocr_used && (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, padding: '1px 5px', borderRadius: 3,
          background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
          border: '1px solid rgba(245,158,11,0.3)',
        }}>
          ocr
        </span>
      )}

      {doc.vision_model_used && (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, padding: '1px 5px', borderRadius: 3,
          background: 'rgba(124,58,237,0.1)', color: '#a78bfa',
          border: '1px solid rgba(124,58,237,0.3)',
        }}>
          vision
        </span>
      )}
    </div>
  )
}

function FileIcon({ fileType }) {
  if (fileType?.includes('image')) {
    return <Image className="w-4 h-4 text-purple-400" />
  }
  return <FileText className="w-4 h-4 text-indigo-400" />
}

export function DocumentList({ documents, onDelete }) {
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(docId) {
    if (!confirm('Delete this document? Its chunks will also be removed.')) return
    setDeleting(docId)
    try {
      await fetch(`/api/knowledge-base/documents/${docId}`, { method: 'DELETE' })
      onDelete(docId)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (!documents?.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No documents yet. Upload some files above.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map(doc => {
        const statusConf = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending
        const StatusIcon = statusConf.icon

        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <FileIcon fileType={doc.file_type} />

            {/* ── Name + content type badges as sibling divs, not nested ── */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {doc.file_name}
              </p>
              {/* Badges are now a sibling <div>, not inside <p> */}
              <ContentTypeBadges doc={doc} />
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(doc.created_at)}
                {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
              </p>
            </div>

            <Badge variant={statusConf.variant}>
              <StatusIcon className={`w-3 h-3 mr-1 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
              {statusConf.label}
            </Badge>

            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deleting === doc.id}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}