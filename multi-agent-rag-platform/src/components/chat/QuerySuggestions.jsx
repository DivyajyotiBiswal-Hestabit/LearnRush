'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const DOMAIN_SUGGESTIONS = {
  'Academic Research': [
    'What are the main findings and conclusions?',
    'What methodology was used in the research?',
    'What are the limitations of this study?',
    'How does this compare to existing literature?',
    'What are the implications for future research?',
  ],
  'Business Strategy': [
    'What are the key growth opportunities?',
    'What risks should we be aware of?',
    'How does this compare to competitors?',
    'What are the recommended next steps?',
    'What are the main revenue drivers?',
  ],
  'Legal Analysis': [
    'What are the key obligations for each party?',
    'What are the highest risk clauses?',
    'What is missing from this document?',
    'What are the termination conditions?',
    'What penalties exist for breach?',
  ],
  'Technical Documentation': [
    'How do I get started with this?',
    'What are the common error messages and fixes?',
    'What are the configuration options?',
    'How do I integrate this with other systems?',
    'What are the performance best practices?',
  ],
  'Financial Analysis': [
    'What is the revenue trend over time?',
    'What are the main cost drivers?',
    'What financial risks are highlighted?',
    'How healthy is the balance sheet?',
    'What does management say about the outlook?',
  ],
  default: [
    'What are the main topics covered?',
    'Summarize the key findings',
    'What are the most important points?',
    'What conclusions can be drawn?',
    'What questions remain unanswered?',
  ],
}

export function QuerySuggestions({ domain, onSelect, lastAnswer, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [showFollowUps, setShowFollowUps] = useState(false)

  useEffect(() => {
    const domainSuggestions =
      DOMAIN_SUGGESTIONS[domain] ?? DOMAIN_SUGGESTIONS.default

    // Shuffle and pick 3
    const shuffled = [...domainSuggestions].sort(() => Math.random() - 0.5)
    setSuggestions(shuffled.slice(0, 3))
  }, [domain])

  useEffect(() => {
    if (!lastAnswer) return

    // Generate context-aware follow-ups based on the answer
    const followUpTemplates = [
      'Can you elaborate on the most important point?',
      'What evidence supports this conclusion?',
      'Are there any counterarguments to consider?',
      'How actionable are these findings?',
      'What should be prioritized first?',
    ]

    const shuffled = [...followUpTemplates].sort(() => Math.random() - 0.5)
    setFollowUps(shuffled.slice(0, 3))
    setShowFollowUps(true)
  }, [lastAnswer])

  if (showFollowUps && followUps.length > 0) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <p className="text-xs font-medium text-gray-600">Follow-up suggestions</p>
          <button
            onClick={() => setShowFollowUps(false)}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >
            dismiss
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {followUps.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className="text-xs px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-medium text-gray-500">Suggested questions</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion)}
            className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors text-left"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}