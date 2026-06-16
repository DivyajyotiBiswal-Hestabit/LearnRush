import { Bot, CheckCircle, Loader, XCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

const STATUS_ICONS = {
  running: <Loader className="w-3.5 h-3.5 animate-spin text-indigo-500" />,
  completed: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-500" />,
}

function TraceItem({ trace }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all',
      trace.status === 'running' ? 'border-indigo-200 bg-indigo-50/50' :
      trace.status === 'completed' ? 'border-gray-200 bg-white' :
      'border-red-200 bg-red-50/50'
    )}>
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => trace.output && setExpanded(e => !e)}
      >
        <Bot className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 flex-1 truncate">
          {trace.agentName}
          {trace.round && (
            <span className="text-xs text-gray-400 ml-1">Round {trace.round}</span>
          )}
          {trace.isSynthesis && (
            <span className="text-xs text-indigo-500 ml-1">Final</span>
          )}
        </span>
        <Badge variant={ROLE_COLORS[trace.role] ?? 'default'}>
          {trace.role}
        </Badge>
        <span className="text-xs text-gray-400 truncate max-w-[80px]">
          {trace.modelId?.replace(':latest', '')}
        </span>
        {STATUS_ICONS[trace.status] ?? null}
        {trace.output && (
          expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {expanded && trace.output && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
            {trace.output}
          </p>
          {trace.processingTime && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {(trace.processingTime / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function TracePanel({ traces, isProcessing }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Agent Collaboration Trace
        </p>
        {isProcessing && (
          <Loader className="w-3 h-3 animate-spin text-indigo-500" />
        )}
      </div>

      {traces.length === 0 && !isProcessing && (
        <p className="text-xs text-gray-400 text-center py-4">
          Traces will appear here during processing
        </p>
      )}

      {traces.map((trace, i) => (
        <TraceItem key={`${trace.agentName}-${trace.stepIndex}-${i}`} trace={trace} />
      ))}
    </div>
  )
}