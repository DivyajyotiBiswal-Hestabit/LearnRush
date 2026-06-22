'use client'

import { useEffect, useRef } from 'react'
import { Bot, CheckCircle, Loader, XCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ROLE_COLORS = {
  researcher: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  critic: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' },
  synthesizer: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' },
  analyst: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' },
  general: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', dot: 'bg-gray-500' },
}

const STATUS_ICONS = {
  pending: null,
  running: <Loader className="w-3 h-3 animate-spin" />,
  completed: <CheckCircle className="w-3 h-3" />,
  failed: <XCircle className="w-3 h-3" />,
}

function AgentNode({ agent, status, isActive, isSynthesis, processingTime }) {
  const colors = ROLE_COLORS[agent.role] ?? ROLE_COLORS.general

  return (
    <div className={cn(
      'relative flex flex-col items-center gap-1.5 transition-all duration-300',
      isActive ? 'scale-105' : 'scale-100'
    )}>
      {/* Node */}
      <div className={cn(
        'relative w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
        colors.bg,
        isActive ? `${colors.border} shadow-lg shadow-${colors.dot}/20` : 'border-gray-200',
        isSynthesis && 'ring-2 ring-yellow-400 ring-offset-1'
      )}>
        <Bot className={cn('w-6 h-6', isActive ? colors.text : 'text-gray-400')} />

        {/* Status badge */}
        {status && status !== 'pending' && (
          <div className={cn(
            'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white',
            status === 'running' ? 'bg-yellow-400' :
            status === 'completed' ? 'bg-green-500' :
            'bg-red-500'
          )}>
            <span className={cn('text-white', status === 'running' ? 'text-yellow-900' : '')}>
              {STATUS_ICONS[status]}
            </span>
          </div>
        )}

        {/* Active pulse ring */}
        {status === 'running' && (
          <div className={cn(
            'absolute inset-0 rounded-2xl border-2 animate-ping opacity-40',
            colors.border
          )} />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className={cn(
          'text-xs font-medium truncate max-w-[72px]',
          isActive ? 'text-red-700' : 'text-white'
        )}>
          {agent.name}
        </p>
        <p className="text-[10px] text-white">
          {agent.model_id?.replace(':latest', '')}
        </p>
        {processingTime && status === 'completed' && (
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            {(processingTime / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  )
}

function FlowArrow({ active, completed }) {
  return (
    <div className="flex items-center justify-center w-8 flex-shrink-0 -mt-5">
      <div className={cn(
        'flex items-center gap-0',
        active ? 'text-indigo-500' : completed ? 'text-green-500' : 'text-gray-300'
      )}>
        <div className={cn(
          'h-0.5 w-5 transition-colors duration-300',
          active ? 'bg-indigo-400' : completed ? 'bg-green-400' : 'bg-gray-200'
        )} />
        <div className={cn(
          'w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] transition-colors duration-300',
          active ? 'border-l-indigo-400' : completed ? 'border-l-green-400' : 'border-l-gray-200'
        )} />
      </div>
    </div>
  )
}

function DebateLayout({ agents, traces, activeAgent }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Round labels */}
      {[1, 2].map(round => {
        const roundTraces = traces.filter(t => t.round === round)
        return (
          <div key={round}>
            <p className="text-xs font-medium text-gray-400 mb-2 text-center">
              Round {round}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {agents.map((agent, i) => {
                const trace = roundTraces.find(t => t.agentName === agent.name)
                const isActive = activeAgent?.agentName === agent.name &&
                  activeAgent?.round === round
                return (
                  <AgentNode
                    key={`${round}-${i}`}
                    agent={agent}
                    status={trace?.status ?? 'pending'}
                    isActive={isActive}
                    processingTime={trace?.processingTime}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CollaborationGraph({ agents, traces, collaborationMode, isProcessing }) {
  if (!agents || agents.length === 0) return null

  // Find the currently active agent
  const activeAgent = traces.find(t => t.status === 'running')

  const getAgentStatus = (agent, stepIndex) => {
    const trace = traces.find(t =>
      t.agentName === agent.name && t.stepIndex === stepIndex
    )
    return trace?.status ?? 'pending'
  }

  const getAgentTrace = (agent) =>
    traces.filter(t => t.agentName === agent.name).pop()

  if (collaborationMode === 'debate') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4 text-center">
          Debate Collaboration
        </p>
        <DebateLayout
          agents={agents}
          traces={traces}
          activeAgent={activeAgent}
        />
      </div>
    )
  }

  if (collaborationMode === 'hierarchical') {
    const [lead, ...subordinates] = agents

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4 text-center">
          Hierarchical Delegation
        </p>
        {/* Lead agent at top */}
        <div className="flex justify-center mb-2">
          <AgentNode
            agent={lead}
            status={getAgentStatus(lead, 0)}
            isActive={activeAgent?.agentName === lead.name}
            processingTime={getAgentTrace(lead)?.processingTime}
          />
        </div>

        {/* Arrows down */}
        <div className="flex justify-center gap-4 mb-2">
          {subordinates.map((_, i) => (
            <div key={i} className="w-0.5 h-5 bg-gray-200 mx-auto" />
          ))}
        </div>

        {/* Subordinates */}
        <div className="flex justify-center gap-4 flex-wrap">
          {subordinates.map((agent, i) => (
            <AgentNode
              key={i}
              agent={agent}
              status={getAgentStatus(agent, i + 1)}
              isActive={activeAgent?.agentName === agent.name}
              processingTime={getAgentTrace(agent)?.processingTime}
            />
          ))}
        </div>
      </div>
    )
  }
  
  if (collaborationMode === 'parallel') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4 text-center">
          Parallel Execution ⚡
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {agents.map((agent, i) => {
            const trace = traces.filter(t => t.agentName === agent.name).pop()
            const isActive = activeAgent?.agentName === agent.name
            return (
              <AgentNode
                key={i}
                agent={agent}
                status={trace?.status ?? 'pending'}
                isActive={isActive}
                processingTime={trace?.processingTime}
              />
            )
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          All agents running simultaneously
        </p>
      </div>
    )
  }
  // Sequential (default)
  return (
    <div className="bg-[#177245] rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4 text-center">
        Sequential Pipeline
      </p>
      <div className="flex items-start justify-center gap-0 flex-wrap">
        {agents.map((agent, i) => {
          const trace = getAgentTrace(agent)
          const isActive = activeAgent?.agentName === agent.name
          const isCompleted = trace?.status === 'completed'

          return (
            <div key={i} className="flex items-center">
              <AgentNode
                agent={agent}
                status={trace?.status ?? 'pending'}
                isActive={isActive}
                processingTime={trace?.processingTime}
              />
              {i < agents.length - 1 && (
                <FlowArrow
                  active={isActive}
                  completed={isCompleted}
                />
              )}
            </div>
          )
        })}

        {/* Synthesis node */}
        {agents.length > 1 && (
          <>
            <FlowArrow
              active={traces.some(t => t.isSynthesis && t.status === 'running')}
              completed={traces.some(t => t.isSynthesis && t.status === 'completed')}
            />
            <AgentNode
              agent={{ name: 'Final Answer', role: 'synthesizer', model_id: '' }}
              status={
                traces.find(t => t.isSynthesis)?.status ?? 'pending'
              }
              isActive={traces.some(t => t.isSynthesis && t.status === 'running')}
              isSynthesis
              processingTime={traces.find(t => t.isSynthesis)?.processingTime}
            />
          </>
        )}
      </div>
    </div>
  )
}