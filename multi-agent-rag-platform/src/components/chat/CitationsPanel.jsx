'use client'

import { useState } from 'react'
import { FileText, Image, Table, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react'

const TYPE_ICONS = {
  text:    FileText,
  image:   Image,
  table:   Table,
  chart:   Table,
  scanned: FileText,
}

const TYPE_COLORS = {
  text:    '#2563EB',
  image:   '#7C3AED',
  table:   '#D97706',
  chart:   '#059669',
  scanned: '#DC2626',
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        flex: 1, height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10, color,
        minWidth: 28, textAlign: 'right',
      }}>
        {pct}%
      </span>
    </div>
  )
}

function CitationCard({ citation, isExpanded, onToggle, query }) {
  const Icon = TYPE_ICONS[citation.chunkType] ?? FileText
  const color = TYPE_COLORS[citation.chunkType] ?? '#2563EB'

  // Highlight query terms in citation text
  function highlightText(text) {
    if (!query || !text) return text
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
    if (words.length === 0) return text

    const regex = new RegExp(`(${words.join('|')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{
          background: 'rgba(202,255,76,0.2)',
          color: '#CAFF4C',
          borderRadius: 2,
          padding: '0 2px',
        }}>
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${isExpanded ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
      background: isExpanded ? `${color}08` : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', cursor: 'pointer',
        }}
      >
        {/* Source number */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, fontWeight: 700, color,
          }}>
            {citation.index}
          </span>
        </div>

        {/* Icon + filename */}
        <Icon size={12} style={{ color, flexShrink: 0 }} />
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, fontWeight: 500,
          color: '#94a3b8',
          flex: 1, overflow: 'hidden',
          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {citation.fileName}
        </span>

        {/* Chunk type badge */}
        {citation.chunkType && citation.chunkType !== 'text' && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, padding: '1px 5px',
            borderRadius: 3,
            background: `${color}15`,
            color, border: `1px solid ${color}30`,
            flexShrink: 0,
          }}>
            {citation.chunkType}
          </span>
        )}

        {/* Page number */}
        {citation.pageNumber && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, color: '#334155', flexShrink: 0,
          }}>
            p.{citation.pageNumber}
          </span>
        )}

        {isExpanded
          ? <ChevronUp size={12} style={{ color: '#334155', flexShrink: 0 }} />
          : <ChevronDown size={12} style={{ color: '#334155', flexShrink: 0 }} />
        }
      </div>

      {/* Relevance bar */}
      <div style={{ padding: '0 12px 8px' }}>
        <ScoreBar score={citation.score} />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{
          padding: '10px 12px 12px',
          borderTop: `1px solid ${color}20`,
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, color: '#64748b',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {highlightText(citation.content)}
            {citation.content.length >= 300 && (
              <span style={{ color: '#334155' }}> ...</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export function CitationsPanel({ citations, query, isVisible }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [showAll, setShowAll] = useState(false)

  if (!citations?.length || !isVisible) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <BookOpen size={28} style={{ color: '#1C2230', margin: '0 auto 10px' }} />
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11, color: '#2A3A52',
        }}>
          No citations yet
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: '#1C2230', marginTop: 4,
        }}>
          Ask a question with a knowledge base selected
        </p>
      </div>
    )
  }

  const displayed = showAll ? citations : citations.slice(0, 4)
  const avgScore = citations.reduce((s, c) => s + c.score, 0) / citations.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* Header stats */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={12} style={{ color: '#7C3AED' }} />
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, color: '#2A3A52',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {citations.length} source{citations.length !== 1 ? 's' : ''} cited
          </span>
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: avgScore >= 0.7 ? '#10B981' : avgScore >= 0.4 ? '#F59E0B' : '#EF4444',
        }}>
          avg {Math.round(avgScore * 100)}% relevance
        </span>
      </div>

      {/* Citation cards */}
      {displayed.map((citation, i) => (
        <CitationCard
          key={i}
          citation={citation}
          query={query}
          isExpanded={expandedIndex === i}
          onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
        />
      ))}

      {/* Show more / less */}
      {citations.length > 4 && (
        <button
          onClick={() => setShowAll(s => !s)}
          style={{
            background: 'none', border: '1px solid #1a2234',
            borderRadius: 6, padding: '6px 0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, color: '#334155',
            cursor: 'pointer', transition: 'all 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.color = '#a78bfa' }}
          onMouseLeave={e => { e.target.style.borderColor = '#1a2234'; e.target.style.color = '#334155' }}
        >
          {showAll ? `▲ show less` : `▼ show ${citations.length - 4} more`}
        </button>
      )}
    </div>
  )
}