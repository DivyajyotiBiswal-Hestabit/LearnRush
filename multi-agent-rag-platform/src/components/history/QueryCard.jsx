'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Bot, Star, Target, Lightbulb, Clock, Download, FileJson, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

const STATUS_COLORS = {
  completed: 'success',
  failed: 'danger',
  processing: 'warning',
  pending: 'default',
}

function ScorePill({ value, label }) {
  if (!value) return null
  const color = value >= 8 ? 'text-green-600' : value >= 6 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-base font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

export function QueryCard({ query, onExportJSON, onExportPDF }) {
  const [expanded, setExpanded] = useState(false)
  const [loadingTraces, setLoadingTraces] = useState(false)
  const [traces, setTraces] = useState(query.agent_traces ?? null)

  async function handleExpand() {
    if (!expanded && !traces) {
      setLoadingTraces(true)
      try {
        const res = await fetch(`/api/history/${query.id}`)
        const data = await res.json()
        setTraces(data.query?.agent_traces ?? [])
      } catch (err) {
        console.error('Failed to load traces:', err)
      } finally {
        setLoadingTraces(false)
      }
    }
    setExpanded(e => !e)
  }

  return (
    <div className="bg-[#ACE1AF] border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={STATUS_COLORS[query.status] ?? 'default'}>
              {query.status}
            </Badge>
            {query.teams?.name && (
              <Badge variant="primary">{query.teams.name}</Badge>
            )}
            {query.teams?.collaboration_mode && (
              <Badge variant="default">{query.teams.collaboration_mode}</Badge>
            )}
          </div>
          <p className="text-sm font-medium text-[#1B4D3E] line-clamp-2">
            {query.question}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDateTime(query.created_at)}
            {query.processing_time_ms && (
              <span className="ml-2">
                · {(query.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {query.chunks_retrieved > 0 && (
              <span className="ml-2">· {query.chunks_retrieved} chunks</span>
            )}
          </p>
        </div>

        {/* Scores */}
        {query.quality_score && (
          <div className="flex gap-4 flex-shrink-0">
            <ScorePill value={query.quality_score} label="Quality" />
            <ScorePill value={query.citation_accuracy} label="Citation" />
            <ScorePill value={query.insight_depth} label="Insight" />
          </div>
        )}

        <div className="flex-shrink-0 ml-2">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-5">
          {/* Final Answer */}
          {query.final_answer && (
            <div>
              <p className="text-xs font-semibold text-[#1B4D3E] uppercase tracking-wide mb-2">
                Final Answer
              </p>
              <div className="bg-[#D0F0C0] rounded-lg p-4 text-sm text-black leading-relaxed whitespace-pre-wrap">
                {query.final_answer}
              </div>
            </div>
          )}

          {/* Agent Traces */}
          <div>
            <p className="text-xs font-semibold text-[#1B4D3E] uppercase tracking-wide mb-2">
              Agent Traces {loadingTraces && '(loading...)'}
            </p>
            {traces?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {traces.map((trace, i) => (
                  <TraceRow key={i} trace={trace} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No traces available</p>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportJSON(query)}
            >
              <FileJson className="w-3.5 h-3.5 mr-1.5" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportPDF({ ...query, agent_traces: traces })}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TraceRow({ trace }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <Bot className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-[#1B4D3E] flex-1">
          {trace.agent_name}
        </span>
        <Badge variant={ROLE_COLORS[trace.agent_role] ?? 'default'}>
          {trace.agent_role}
        </Badge>
        <span className="text-xs text-gray-400">
          {trace.model_id?.replace(':latest', '')}
        </span>
        <Badge variant={trace.status === 'completed' ? 'success' : 'danger'}>
          {trace.status}
        </Badge>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-[#1B4D3E]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[#1B4D3E]" />
        }
      </div>

      {expanded && trace.output && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <p className="text-xs text-[#1B4D3E] mt-2 leading-relaxed whitespace-pre-wrap">
            {trace.output}
          </p>
          {trace.processing_time_ms && (
            <p className="text-xs text-gray-400 mt-2">
              {(trace.processing_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}
    </div>
  )
}