import { Star, Target, Lightbulb, Clock } from 'lucide-react'

function ScoreBar({ value, max = 10 }) {
  const pct = (value / max) * 100
  const color = value >= 8 ? 'bg-green-500' : value >= 6 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6 text-right">{value}</span>
    </div>
  )
}

export function ScoreCard({ scores, processingTime, chunksRetrieved }) {
  if (!scores) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Answer Scorecard
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-gray-600">Overall Quality</span>
          </div>
          <ScoreBar value={scores.quality} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-gray-600">Citation Accuracy</span>
          </div>
          <ScoreBar value={scores.citation_accuracy} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-gray-600">Insight Depth</span>
          </div>
          <ScoreBar value={scores.insight_depth} />
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {(processingTime / 1000).toFixed(1)}s
          </div>
          <div className="text-xs text-gray-400">
            {chunksRetrieved} chunks used
          </div>
        </div>
      </div>
    </div>
  )
}