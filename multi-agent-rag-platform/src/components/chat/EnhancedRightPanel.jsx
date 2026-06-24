'use client'

import { useState } from 'react'
import { GitBranch, List, FileText, Star } from 'lucide-react'
import { CollaborationGraph } from '@/components/chat/CollaborationGraph'
import { AgentThinkingPanel } from '@/components/chat/AgentThinking'
import { TracePanel } from '@/components/chat/TracePanel'
import { SourcePreview } from '@/components/chat/SourcePreview'
import { ScoreCard } from '@/components/chat/ScoreCard'
import { cn } from '@/lib/utils/cn'
import { CitationsPanel } from '@/components/chat/CitationsPanel'
import { EvaluationPanel } from '@/components/evaluation/EvaluationPanel'

const TABS = [
  { id: 'graph', label: 'Graph', icon: GitBranch },
  { id: 'trace', label: 'Trace', icon: List },
  { id: 'sources', label: 'Sources', icon: FileText },
  { id: 'score', label: 'Score', icon: Star },
]

export function EnhancedRightPanel({
  team,
  traces,
  chunks,
  citations,
  scores,
  processingTime,
  chunksRetrieved,
  isProcessing,
  lastQuestion,
  queryId,
}) {
  const [activeTab, setActiveTab] = useState('graph')

  return (
    <div className="hidden lg:flex flex-col w-96 border-5 border-[#1B4D3E] bg-[#E9FFDB] flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">Live Research Trace</p>
        {team && (
          <p className="text-xs text-gray-400 mt-0.5">
            {team.agents?.length} agents · {team.collaboration_mode}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'text-[#1B4D3E] border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'graph' && (
          <div className="flex flex-col gap-4">
            {/* Collaboration Graph */}
            {team && (
              <CollaborationGraph
                agents={team.agents ?? []}
                traces={traces}
                collaborationMode={team.collaboration_mode}
                isProcessing={isProcessing}
              />
            )}

            {/* Agent Thinking Panel */}
            {(isProcessing || traces.length > 0) && (
              <AgentThinkingPanel
                traces={traces}
                isProcessing={isProcessing}
              />
            )}

            {/* Empty state */}
            {!isProcessing && traces.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-[#1B4D3E]">
                  Ask a question to see the collaboration graph
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trace' && (
          <TracePanel traces={traces} isProcessing={isProcessing} />
        )}

        {activeTab === 'sources' && (
          <CitationsPanel
            citations={citations}
            query={lastQuestion}
            isVisible={true}
          />
        )}

        {activeTab === 'score' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scores ? (
              <>
                <ScoreCard
                  scores={scores}
                  processingTime={processingTime}
                  chunksRetrieved={chunksRetrieved}
                />
                {/* Evaluation panel — only shown on demand */}
                {queryId && (
                  <EvaluationPanel queryId={queryId} />
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Star size={28} style={{ color: '#1C2230', margin: '0 auto 10px' }} />
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11, color: '#2A3A52',
                }}>
                  Scorecard will appear after the first query
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}