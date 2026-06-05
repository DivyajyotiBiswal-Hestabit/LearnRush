'use client'

import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import {
  Star, AlertTriangle, TrendingUp,
  Loader, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const AGENT_COLORS = {
  classifier: 'bg-blue-500',
  researcher: 'bg-purple-500',
  qualifier: 'bg-yellow-500',
  responder: 'bg-green-500',
  executor: 'bg-red-500',
}

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[#a0a0b8] text-xs capitalize">{label}</span>
        <span className={`text-xs font-bold ${
          score >= 8 ? 'text-success' :
          score >= 6 ? 'text-warning' :
          'text-error'
        }`}>
          {score}/10
        </span>
      </div>
      <div className="w-full bg-[#2e2e4e] rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${
            score >= 8 ? 'bg-success' :
            score >= 6 ? 'bg-warning' :
            'bg-error'
          }`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  )
}

function OverallScore({ score }) {
  const color = score >= 8 ? 'text-success' :
                score >= 6 ? 'text-warning' : 'text-error'
  const bg = score >= 8 ? 'bg-success/10 border-success/20' :
             score >= 6 ? 'bg-warning/10 border-warning/20' :
             'bg-error/10 border-error/20'

  return (
    <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 ${bg}`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-[#a0a0b8] text-xs">/10</span>
    </div>
  )
}

export default function ScorecardView({ executionId }) {
  const { fetchScorecard, generateScorecard } = useAnalytics()
  const [scorecard, setScorecard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadScorecard()
  }, [executionId])

  const loadScorecard = async () => {
    setLoading(true)
    const data = await fetchScorecard(executionId)
    setScorecard(data)
    setLoading(false)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    toast.loading('Generating scorecard with AI...')
    const data = await generateScorecard(executionId)
    toast.dismiss()
    if (data) {
      setScorecard(data)
      toast.success('Scorecard generated!')
    } else {
      toast.error('Failed to generate scorecard')
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader size={20} className="text-accent animate-spin" />
      </div>
    )
  }

  if (!scorecard) {
    return (
      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-6 text-center">
        <Star size={24} className="text-[#4e4e6e] mx-auto mb-3" />
        <p className="text-white font-medium text-sm mb-1">No scorecard yet</p>
        <p className="text-[#a0a0b8] text-xs mb-4">
          Generate an AI scorecard for this execution
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mx-auto"
        >
          {generating
            ? <Loader size={14} className="animate-spin" />
            : <Star size={14} />
          }
          {generating ? 'Generating...' : 'Generate Scorecard'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-[#2e2e4e] rounded-xl p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">AI Scorecard</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 text-[#a0a0b8] hover:text-white text-xs transition-colors"
        >
          <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-5">
        <OverallScore score={scorecard.overall_score} />
        <div>
          <p className="text-white font-semibold text-lg">
            {scorecard.overall_score >= 8 ? 'Excellent' :
             scorecard.overall_score >= 6 ? 'Good' :
             scorecard.overall_score >= 4 ? 'Fair' : 'Needs Improvement'}
          </p>
          <p className="text-[#a0a0b8] text-sm">Overall quality score</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-[#a0a0b8]">
              <TrendingUp size={12} className="text-success" />
              Relevance: {scorecard.response_relevance}/10
            </div>
            <div className="flex items-center gap-1 text-xs text-[#a0a0b8]">
              Completeness: {scorecard.response_completeness}/10
            </div>
          </div>
        </div>
      </div>

      {/* Per-agent scores */}
      <div>
        <p className="text-white text-sm font-medium mb-3">Per-Agent Scores</p>
        <div className="space-y-3">
          {[
            { key: 'classifier_score', label: 'Classifier Agent' },
            { key: 'researcher_score', label: 'Researcher Agent' },
            { key: 'qualifier_score', label: 'Qualifier Agent' },
            { key: 'responder_score', label: 'Responder Agent' },
            { key: 'executor_score', label: 'Executor Agent' },
          ].map(({ key, label }) => (
            <ScoreBar
              key={key}
              label={label}
              score={scorecard[key]}
            />
          ))}
        </div>
      </div>

      {/* Bottleneck */}
      {scorecard.bottleneck_agent && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-warning" />
            <p className="text-warning text-xs font-medium">
              Bottleneck: {scorecard.bottleneck_agent} Agent
            </p>
          </div>
          <p className="text-[#a0a0b8] text-xs">
            {scorecard.bottleneck_reason}
          </p>
        </div>
      )}

      {/* Suggestions */}
      {scorecard.suggestions?.length > 0 && (
        <div>
          <p className="text-white text-sm font-medium mb-2">Improvement Suggestions</p>
          <ul className="space-y-2">
            {scorecard.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent text-xs mt-0.5">•</span>
                <span className="text-[#a0a0b8] text-xs">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}