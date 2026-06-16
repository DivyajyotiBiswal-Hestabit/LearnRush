'use client'

import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, ExternalLink, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

function highlightText(text, query) {
  if (!query || !text) return text

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)

  if (words.length === 0) return text

  const regex = new RegExp(`(${words.join('|')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  )
}

function SourceChunk({ chunk, index, query, expanded, onToggle }) {
  const score = chunk.hybrid_score ?? chunk.vector_score ?? chunk.similarity ?? 0
  const scorePct = Math.round(score * 100)
  const fileName = chunk.metadata?.file_name ?? 'Unknown source'
  const chunkType = chunk.chunk_type ?? 'text'

  return (
    <div className={cn(
      'border rounded-xl overflow-hidden transition-all',
      expanded ? 'border-indigo-200' : 'border-gray-200'
    )}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 cursor-pointer',
          expanded ? 'bg-indigo-50' : 'hover:bg-gray-50'
        )}
        onClick={onToggle}
      >
        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-indigo-700">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
              {fileName}
            </span>
            {chunkType !== 'text' && (
              <Badge variant="warning">{chunkType}</Badge>
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                scorePct >= 70 ? 'bg-green-500' :
                scorePct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
              )}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">{scorePct}%</span>
        </div>

        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        }
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 py-3 border-t border-indigo-100">
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
            {highlightText(chunk.content, query)}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
            {chunk.chunk_index !== undefined && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Hash className="w-2.5 h-2.5" />
                Chunk {chunk.chunk_index + 1}
              </span>
            )}
            {chunk.vector_score !== undefined && (
              <span className="text-[10px] text-gray-400">
                Vector: {Math.round(chunk.vector_score * 100)}%
              </span>
            )}
            {chunk.keyword_score !== undefined && chunk.keyword_score > 0 && (
              <span className="text-[10px] text-gray-400">
                Keyword: {Math.round(chunk.keyword_score * 100)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function SourcePreview({ chunks, query, isVisible }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [showAll, setShowAll] = useState(false)

  if (!chunks || chunks.length === 0 || !isVisible) return null

  const displayChunks = showAll ? chunks : chunks.slice(0, 3)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Sources Used ({chunks.length})
        </p>
        {chunks.length > 3 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showAll ? 'Show less' : `+${chunks.length - 3} more`}
          </button>
        )}
      </div>

      {displayChunks.map((chunk, i) => (
        <SourceChunk
          key={chunk.id ?? i}
          chunk={chunk}
          index={i}
          query={query}
          expanded={expandedIndex === i}
          onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
        />
      ))}
    </div>
  )
}