'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, CheckCircle, XCircle, Clock,
  Mail, MessageCircle, Download,
  ChevronDown, ChevronUp, Circle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
import ScorecardView from '@/components/scorecard/ScorecardView'

const AGENT_COLORS = {
  classifier: 'bg-blue-500',
  researcher: 'bg-purple-500',
  qualifier: 'bg-yellow-500',
  responder: 'bg-green-500',
  executor: 'bg-red-500',
}

const AGENT_ORDER = ['classifier', 'researcher', 'qualifier', 'responder', 'executor']

function AgentLogCard({ log }) {
  const [expanded, setExpanded] = useState(false)
  const color = AGENT_COLORS[log.agent_role] || 'bg-accent'

  const getStatusIcon = () => {
    if (log.status === 'completed') return <CheckCircle size={16} className="text-success" />
    if (log.status === 'failed') return <AlertCircle size={16} className="text-error" />
    if (log.status === 'running') return (
      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    )
    return <Circle size={16} className="text-[#4e4e6e]" />
  }

  return (
    <div className="bg-[#0f0f17] border border-[#2e2e4e] rounded-xl overflow-hidden">
      <button
        onClick={() => log.status === 'completed' && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#16213e] transition-colors"
      >
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {log.agent_role.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium text-sm capitalize">
            {log.agent_role} Agent
          </p>
          <p className="text-[#4e4e6e] text-xs mt-0.5">
            {formatDate(log.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-xs capitalize ${
            log.status === 'completed' ? 'text-success' :
            log.status === 'failed' ? 'text-error' :
            log.status === 'running' ? 'text-accent' :
            'text-[#4e4e6e]'
          }`}>
            {log.status}
          </span>
          {log.status === 'completed' && (
            expanded
              ? <ChevronUp size={14} className="text-[#a0a0b8]" />
              : <ChevronDown size={14} className="text-[#a0a0b8]" />
          )}
        </div>
      </button>

      {expanded && log.output && (
        <div className="px-4 pb-4 border-t border-[#2e2e4e]">
          <p className="text-[#a0a0b8] text-xs font-medium mt-3 mb-2">Output</p>
          <pre className="text-white text-xs bg-background rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {typeof log.output?.result === 'string'
              ? (() => {
                  try {
                    return JSON.stringify(JSON.parse(log.output.result), null, 2)
                  } catch {
                    return log.output.result
                  }
                })()
              : JSON.stringify(log.output, null, 2)
            }
          </pre>
        </div>
      )}
    </div>
  )
}

export default function ExecutionDetailPage() {
  const params = useParams()
  const [execution, setExecution] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  useEffect(() => {
    fetchData()

    // Realtime subscription
    const channel = supabase
      .channel(`execution-detail-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_logs',
          filter: `execution_id=eq.${params.id}`
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${params.id}`
        },
        (payload) => setExecution(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [params.id])

  const fetchData = async () => {
    try {
      const token = await getToken()

      const [execRes, logsRes] = await Promise.all([
        fetch(`/api/executions/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/executions/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const data = await execRes.json()
      if (data.execution) setExecution(data.execution)
      if (data.logs) {
        // Sort logs by agent order
        const sorted = [...data.logs].sort((a, b) => {
          return AGENT_ORDER.indexOf(a.agent_role) - AGENT_ORDER.indexOf(b.agent_role)
        })
        setLogs(sorted)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ execution, logs }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-${params.id}.json`
    a.click()
  }

  const exportTXT = () => {
    const text = `
EXECUTION REPORT
================
ID: ${execution?.id}
Status: ${execution?.status}
Date: ${formatDate(execution?.started_at)}
Duration: ${formatDuration(execution?.duration_ms)}
Channel: ${execution?.trigger_channel}

ORIGINAL MESSAGE
----------------
${execution?.original_message}

AGENT TRACE
-----------
${logs.map(l => `
${l.agent_role.toUpperCase()} AGENT
Status: ${l.status}
Output: ${JSON.stringify(l.output, null, 2)}
`).join('\n')}

FINAL REPLY
-----------
${execution?.final_reply}
    `.trim()

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-${params.id}.txt`
    a.click()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-[#a0a0b8]">Execution not found</p>
        <Link href="/dashboard/executions" className="text-accent text-sm mt-2 block">
          Back to executions
        </Link>
      </div>
    )
  }

  const completedAgents = logs.filter(l => l.status === 'completed').length

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/executions"
            className="p-2 text-[#a0a0b8] hover:text-white hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Execution Trace</h1>
            <p className="text-[#4e4e6e] text-xs mt-0.5 font-mono">
              {execution.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportTXT}
            className="flex items-center gap-1.5 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Download size={12} />
            TXT
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Download size={12} />
            JSON
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Status',
            value: execution.status,
            color: execution.status === 'completed' ? 'text-success' :
                   execution.status === 'failed' ? 'text-error' : 'text-blue-400'
          },
          {
            label: 'Channel',
            value: execution.trigger_channel,
            color: 'text-white'
          },
          {
            label: 'Duration',
            value: execution.duration_ms ? formatDuration(execution.duration_ms) : 'Running...',
            color: 'text-white'
          },
          {
            label: 'Agents',
            value: `${completedAgents}/5`,
            color: completedAgents === 5 ? 'text-success' : 'text-accent'
          },
        ].map((item, i) => (
          <div key={i} className="bg-surface border border-[#2e2e4e] rounded-xl p-4">
            <p className="text-[#a0a0b8] text-xs mb-1">{item.label}</p>
            <p className={`font-semibold text-sm capitalize ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Original message */}
      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          {execution.trigger_channel === 'gmail'
            ? <Mail size={15} className="text-red-400" />
            : <MessageCircle size={15} className="text-green-400" />
          }
          <p className="text-white font-semibold text-sm">Original Message</p>
        </div>
        <p className="text-[#a0a0b8] text-sm leading-relaxed">
          {execution.original_message}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-medium">Agent Pipeline Progress</p>
          <p className="text-[#a0a0b8] text-xs">{completedAgents}/5 completed</p>
        </div>
        <div className="w-full bg-[#2e2e4e] rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedAgents / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Agent trace */}
      <div className="mb-4">
        <h2 className="text-white font-semibold text-sm mb-3">Agent Trace</h2>
        <div className="space-y-2">
          {logs.length > 0 ? (
            logs.map(log => (
              <AgentLogCard key={log.id} log={log} />
            ))
          ) : (
            AGENT_ORDER.map(role => (
              <div key={role} className="bg-[#0f0f17] border border-[#2e2e4e] rounded-xl p-4 flex items-center gap-3">
                <div className={`w-8 h-8 ${AGENT_COLORS[role]} rounded-lg flex items-center justify-center text-white text-xs font-bold opacity-30`}>
                  {role.charAt(0).toUpperCase()}
                </div>
                <p className="text-[#4e4e6e] text-sm capitalize">{role} Agent — Pending</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Final reply */}
      {execution.final_reply && (
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={15} className="text-success" />
                <p className="text-white font-semibold text-sm">Final Reply</p>
            </div>
            <div className="bg-[#0f0f17] rounded-lg p-4">
                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                    {(() => {
                        try {
                            const parsed = JSON.parse(execution.final_reply)
                            if (parsed.final_reply) return parsed.final_reply
                            if (parsed.success) return 'Execution completed successfully. Run a new test to see the reply.'
                            return execution.final_reply
                        } catch {
                            return execution.final_reply
                        }
                    })()}
                </p>
            </div>
        </div>
      )}

      {/* Scorecard */}
      {execution.status === 'completed' && (
        <div className="mt-4">
            <h2 className="text-white font-semibold text-sm mb-3">AI Scorecard</h2>
            <ScorecardView executionId={execution.id} />
        </div>
      )}

    </div>
  )
}