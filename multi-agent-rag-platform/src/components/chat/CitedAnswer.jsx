'use client'

import { useState } from 'react'

/**
 * Renders the final answer with inline [Source N] citations as clickable chips
 * Clicking a chip highlights that source in the citations panel
 */
export function CitedAnswer({ content, citations = [], onCitationClick }) {
  const [hoveredCitation, setHoveredCitation] = useState(null)

  if (!content) return null

  // Parse [Source N] patterns in the text
  const parts = content.split(/(\[Source \d+\])/g)

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 14, lineHeight: 1.75,
      color: '#CBD5E1',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {parts.map((part, i) => {
        const match = part.match(/\[Source (\d+)\]/)
        if (!match) return <span key={i}>{part}</span>

        const sourceNum = parseInt(match[1])
        const citation = citations.find(c => c.index === sourceNum)
        const isHovered = hoveredCitation === sourceNum

        return (
          <span
            key={i}
            onClick={() => onCitationClick?.(sourceNum - 1)}
            onMouseEnter={() => setHoveredCitation(sourceNum)}
            onMouseLeave={() => setHoveredCitation(null)}
            title={citation ? `${citation.fileName} (${Math.round(citation.score * 100)}% relevance)` : `Source ${sourceNum}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 2px',
              padding: '1px 6px',
              borderRadius: 4,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, fontWeight: 600,
              cursor: citation ? 'pointer' : 'default',
              verticalAlign: 'middle',
              transition: 'all 0.15s',
              background: isHovered
                ? 'rgba(124,58,237,0.25)'
                : 'rgba(124,58,237,0.12)',
              color: isHovered ? '#c4b5fd' : '#a78bfa',
              border: `1px solid ${isHovered ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.25)'}`,
              transform: isHovered ? 'translateY(-1px)' : 'none',
            }}
          >
            {sourceNum}
          </span>
        )
      })}
    </div>
  )
}