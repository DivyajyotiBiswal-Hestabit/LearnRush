'use client'

import { useState } from 'react'
import { useExecutions } from '@/hooks/useExecutions'
import {
  History, CheckCircle, XCircle, Clock,
  Mail, MessageCircle, ChevronDown, ChevronUp,
  Download, Filter
} from 'lucide-react'
import { formatDate, formatDuration, truncate } from '@/lib/utils'
import Link from 'next/link'

function StatusBadge({ status }) {
  const config = {
    completed: { color: 'bg-success/10 text-success', icon: CheckCircle },
    failed: { color: 'bg-error/10 text-error', icon: XCircle },
    running: { color: 'bg-blue-400/10 text-blue-400', icon: Clock },
    pending: { color: 'bg-warning/10 text-warning', icon: Clock },
  }
  const { color, icon: Icon } = config[status] || config.pending

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={10} />
      {status}
    </div>
  )
}

function ExecutionRow({ execution }) {
  const [expanded, setExpanded] = useState(false)

  const exportJSON = () => {
    const data = JSON.stringify(execution, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-${execution.id}.json`
    a.click()
  }

  return (
    <div className="border-b border-[#2e2e4e] last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#16213e] transition-colors text-left"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          execution.status === 'completed' ? 'bg-success' :
          execution.status === 'failed' ? 'bg-error' :
          execution.status === 'running' ? 'bg-blue-400 animate-pulse' :
          'bg-warning'
        }`} />

        {execution.trigger_channel === 'gmail'
          ? <Mail size={15} className="text-red-400 flex-shrink-0" />
          : <MessageCircle size={15} className="text-green-400 flex-shrink-0" />
        }

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate">
            {truncate(execution.original_message, 80)}
          </p>
          <p className="text-[#4e4e6e] text-xs mt-0.5">
            {formatDate(execution.started_at)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {execution.duration_ms && (
            <span className="text-[#4e4e6e] text-xs">
              {formatDuration(execution.duration_ms)}
            </span>
          )}
          <StatusBadge status={execution.status} />
          {expanded
            ? <ChevronUp size={14} className="text-[#a0a0b8]" />
            : <ChevronDown size={14} className="text-[#a0a0b8]" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="bg-[#0f0f17] rounded-lg p-4">
            <p className="text-[#a0a0b8] text-xs font-medium mb-2">Original Message</p>
            <p className="text-white text-sm">{execution.original_message}</p>
          </div>

          {execution.final_reply && (
            <div className="bg-[#0f0f17] rounded-lg p-4">
              <p className="text-[#a0a0b8] text-xs font-medium mb-2">Final Reply</p>
              <p className="text-white text-sm whitespace-pre-wrap">
                {execution.final_reply}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/executions/${execution.id}`}
              className="flex items-center gap-1.5 text-accent text-xs hover:underline"
            >
              View full trace →
            </Link>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 text-[#a0a0b8] hover:text-white text-xs ml-auto border border-[#2e2e4e] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={12} />
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExecutionsPage() {
  const { executions, loading } = useExecutions()
  const [filter, setFilter] = useState('all')

  const filtered = executions.filter(e => {
    if (filter === 'all') return true
    return e.status === filter
  })

  const stats = {
    total: executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'running').length,
  }

  return (
    <div className="max-w-5xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Executions</h1>
          <p className="text-[#a0a0b8] text-sm mt-1">
            All automation runs across your workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Completed', value: stats.completed, color: 'text-success' },
          { label: 'Failed', value: stats.failed, color: 'text-error' },
          { label: 'Running', value: stats.running, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-[#2e2e4e] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[#a0a0b8] text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-[#a0a0b8]" />
        {['all', 'completed', 'failed', 'running'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-surface text-[#a0a0b8] hover:text-white border border-[#2e2e4e]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-[#2e2e4e] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#a0a0b8] text-sm">Loading executions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History size={28} className="text-[#4e4e6e] mx-auto mb-3" />
            <p className="text-white font-medium text-sm mb-1">No executions yet</p>
            <p className="text-[#a0a0b8] text-xs">
              Trigger a workflow to see execution history here
            </p>
          </div>
        ) : (
          filtered.map(execution => (
            <ExecutionRow key={execution.id} execution={execution} />
          ))
        )}
      </div>
    </div>
  )
}