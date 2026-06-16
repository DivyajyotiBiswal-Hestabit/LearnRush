'use client'

import { Bot, Zap, Brain, Search, PenLine } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

const ROLE_ICONS = {
  researcher: Search,
  critic: Brain,
  synthesizer: PenLine,
  analyst: Zap,
  general: Bot,
}

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

const THINKING_MESSAGES = {
  researcher: [
    'Searching knowledge base...',
    'Extracting key findings...',
    'Analyzing sources...',
    'Gathering evidence...',
  ],
  critic: [
    'Reviewing findings...',
    'Identifying gaps...',
    'Challenging assumptions...',
    'Assessing evidence quality...',
  ],
  synthesizer: [
    'Combining insights...',
    'Structuring response...',
    'Finalizing answer...',
    'Checking coherence...',
  ],
  analyst: [
    'Processing data...',
    'Identifying patterns...',
    'Computing metrics...',
    'Drawing conclusions...',
  ],
  general: [
    'Processing query...',
    'Formulating response...',
    'Almost there...',
  ],
}

function getThinkingMessage(role, elapsed) {
  const messages = THINKING_MESSAGES[role] ?? THINKING_MESSAGES.general
  const index = Math.floor(elapsed / 8) % messages.length
  return messages[index]
}

export function AgentThinkingCard({ trace, elapsed = 0 }) {
  const Icon = ROLE_ICONS[trace.role] ?? Bot
  const message = getThinkingMessage(trace.role, elapsed)

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      trace.status === 'running'
        ? 'border-indigo-200 bg-indigo-50/50'
        : trace.status === 'completed'
        ? 'border-green-200 bg-green-50/30'
        : 'border-red-200 bg-red-50/30'
    )}>
      {/* Icon with pulse */}
      <div className={cn(
        'relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        trace.status === 'running' ? 'bg-indigo-100' :
        trace.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
      )}>
        <Icon className={cn(
          'w-4 h-4',
          trace.status === 'running' ? 'text-indigo-600' :
          trace.status === 'completed' ? 'text-green-600' : 'text-red-600'
        )} />
        {trace.status === 'running' && (
          <span className="absolute inset-0 rounded-lg bg-indigo-400 animate-ping opacity-20" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{trace.agentName}</span>
          <Badge variant={ROLE_COLORS[trace.role] ?? 'default'}>
            {trace.role}
          </Badge>
          <span className="text-xs text-gray-400 ml-1">
            {trace.modelId?.replace(':latest', '')}
          </span>
        </div>

        {/* Status message */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {trace.status === 'running' && (
            <>
              <span className="text-xs text-indigo-600">{message}</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </>
          )}
          {trace.status === 'completed' && (
            <span className="text-xs text-green-600">
              ✓ Done in {(trace.processingTime / 1000).toFixed(1)}s
            </span>
          )}
          {trace.status === 'failed' && (
            <span className="text-xs text-red-600">
              Failed: {trace.output?.slice(0, 50)}
            </span>
          )}
        </div>
      </div>

      {/* Round badge for debate */}
      {trace.round && (
        <Badge variant="default">R{trace.round}</Badge>
      )}
    </div>
  )
}

export function AgentThinkingPanel({ traces, isProcessing }) {
  const runningTraces = traces.filter(t => t.status === 'running')
  const recentTraces = traces.filter(t => t.status !== 'running').slice(-3)

  if (!isProcessing && traces.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Running agents */}
      {runningTraces.map((trace, i) => (
        <AgentThinkingCard key={`running-${i}`} trace={trace} />
      ))}

      {/* Recent completed */}
      {recentTraces.map((trace, i) => (
        <AgentThinkingCard key={`done-${i}`} trace={trace} />
      ))}
    </div>
  )
}