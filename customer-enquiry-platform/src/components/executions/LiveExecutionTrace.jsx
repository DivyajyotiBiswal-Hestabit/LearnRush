'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, Circle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const AGENTS = [
  { role: 'classifier', label: 'Classifier Agent', description: 'Categorizing inquiry', color: 'bg-blue-500' },
  { role: 'researcher', label: 'Researcher Agent', description: 'Searching knowledge base', color: 'bg-purple-500' },
  { role: 'qualifier', label: 'Qualifier Agent', description: 'Qualifying lead', color: 'bg-yellow-500' },
  { role: 'responder', label: 'Responder Agent', description: 'Drafting reply', color: 'bg-green-500' },
  { role: 'executor', label: 'Executor Agent', description: 'Finalizing response', color: 'bg-red-500' },
]

function AgentStep({ agent, log, isActive }) {
  const [expanded, setExpanded] = useState(false)

  const getIcon = () => {
    if (!log || log.status === 'pending') {
      return <Circle size={18} className="text-[#4e4e6e]" />
    }
    if (log.status === 'running') {
      return (
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      )
    }
    if (log.status === 'completed') {
      return <CheckCircle size={18} className="text-success" />
    }
    if (log.status === 'failed') {
      return <AlertCircle size={18} className="text-error" />
    }
    return <Circle size={18} className="text-[#4e4e6e]" />
  }

  const getStatusText = () => {
    if (!log || log.status === 'pending') return 'Waiting'
    if (log.status === 'running') return 'Running...'
    if (log.status === 'completed') return 'Completed'
    if (log.status === 'failed') return 'Failed'
    return 'Waiting'
  }

  const getStatusColor = () => {
    if (!log || log.status === 'pending') return 'text-[#4e4e6e]'
    if (log.status === 'running') return 'text-accent'
    if (log.status === 'completed') return 'text-success'
    if (log.status === 'failed') return 'text-error'
    return 'text-[#4e4e6e]'
  }

  const isCompleted = log?.status === 'completed'
  const isRunning = log?.status === 'running' || isActive

  return (
    <div className={`border border-[#2e2e4e] rounded-xl overflow-hidden transition-all ${
      isRunning ? 'border-accent/50 bg-accent/5' :
      isCompleted ? 'border-success/20' : ''
    }`}>
      <div
        className={`flex items-center gap-3 p-4 ${isCompleted ? 'cursor-pointer hover:bg-[#16213e]' : ''}`}
        onClick={() => isCompleted && setExpanded(!expanded)}
      >
        {/* Step icon */}
        <div className="flex-shrink-0 w-5 flex items-center justify-center">
          {getIcon()}
        </div>

        {/* Agent color dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.color}`} />

        {/* Agent info */}
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            isCompleted ? 'text-white' :
            isRunning ? 'text-accent' :
            'text-[#4e4e6e]'
          }`}>
            {agent.label}
          </p>
          {isRunning && (
            <p className="text-xs text-accent mt-0.5 animate-pulse">
              {agent.description}...
            </p>
          )}
        </div>

        {/* Status */}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>

        {/* Expand arrow for completed */}
        {isCompleted && (
          expanded
            ? <ChevronUp size={14} className="text-[#a0a0b8]" />
            : <ChevronDown size={14} className="text-[#a0a0b8]" />
        )}
      </div>

      {/* Expanded output */}
      {expanded && isCompleted && log?.output && (
        <div className="px-4 pb-4 border-t border-[#2e2e4e]">
          <pre className="text-xs text-[#a0a0b8] bg-background rounded-lg p-3 overflow-x-auto whitespace-pre-wrap mt-3">
            {typeof log.output?.result === 'string'
              ? log.output.result
              : JSON.stringify(log.output, null, 2)
            }
          </pre>
        </div>
      )}
    </div>
  )
}

export default function LiveExecutionTrace({ executionId, onComplete }) {
  const [logs, setLogs] = useState({})
  const [execution, setExecution] = useState(null)
  const [activeAgent, setActiveAgent] = useState('classifier')

  useEffect(() => {
    if (!executionId) return

    // Initial fetch
    fetchExecutionData()

    // Subscribe to realtime updates on execution_logs
    const logsChannel = supabase
      .channel(`execution-logs-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_logs',
          filter: `execution_id=eq.${executionId}`
        },
        (payload) => {
          console.log('Log update:', payload)
          if (payload.new) {
            setLogs(prev => ({
              ...prev,
              [payload.new.agent_role]: payload.new
            }))
            // Update active agent
            if (payload.new.status === 'completed') {
              const agentIndex = AGENTS.findIndex(a => a.role === payload.new.agent_role)
              if (agentIndex < AGENTS.length - 1) {
                setActiveAgent(AGENTS[agentIndex + 1].role)
              }
            }
          }
        }
      )
      .subscribe()

    // Subscribe to execution status changes
    const executionChannel = supabase
      .channel(`execution-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionId}`
        },
        (payload) => {
          console.log('Execution update:', payload)
          setExecution(payload.new)
          if (payload.new.status === 'completed' || payload.new.status === 'failed') {
            onComplete && onComplete(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(logsChannel)
      supabase.removeChannel(executionChannel)
    }
  }, [executionId])

  const fetchExecutionData = async () => {
    const { data: execData } = await supabase
      .from('executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (execData) setExecution(execData)

    const { data: logsData } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('execution_id', executionId)

    if (logsData) {
      const logsMap = {}
      logsData.forEach(log => {
        logsMap[log.agent_role] = log
      })
      setLogs(logsMap)

      // Set active agent
      const running = logsData.find(l => l.status === 'running')
      const lastCompleted = [...logsData]
        .filter(l => l.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

      if (running) {
        setActiveAgent(running.agent_role)
      } else if (lastCompleted) {
        const idx = AGENTS.findIndex(a => a.role === lastCompleted.agent_role)
        if (idx < AGENTS.length - 1) {
          setActiveAgent(AGENTS[idx + 1].role)
        }
      }
    }
  }

  const completedCount = Object.values(logs).filter(l => l?.status === 'completed').length
  const progress = (completedCount / 5) * 100

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-medium">
            {execution?.status === 'completed' ? 'Execution Complete' :
             execution?.status === 'failed' ? 'Execution Failed' :
             '⚡ Processing...'}
          </p>
          <p className="text-[#a0a0b8] text-xs">{completedCount}/5 agents</p>
        </div>
        <div className="w-full bg-[#2e2e4e] rounded-full h-1.5">
          <div
            className="bg-accent h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Agent steps */}
      <div className="space-y-2">
        {AGENTS.map((agent) => (
          <AgentStep
            key={agent.role}
            agent={agent}
            log={logs[agent.role]}
            isActive={activeAgent === agent.role && execution?.status === 'running'}
          />
        ))}
      </div>

      {/* Final reply preview */}
      {execution?.status === 'completed' && execution?.final_reply && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 mt-4">
          <p className="text-success text-xs font-medium mb-2">Final Reply Generated</p>
          <p className="text-white text-sm line-clamp-3">{execution.final_reply}</p>
        </div>
      )}
    </div>
  )
}