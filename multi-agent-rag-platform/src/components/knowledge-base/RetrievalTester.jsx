'use client'

import { useState } from 'react'
import { Search, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function RetrievalTester({ knowledgeBaseId }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [open, setOpen] = useState(false)

  async function handleTest() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await fetch('/api/knowledge-base/test-retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, knowledgeBaseId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Retrieval failed')
        return
      }

      setResults(data.chunks ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-gray-700">Test Retrieval</span>
        <span className="ml-auto text-xs text-gray-400">
          {open ? 'Hide' : 'Test your RAG pipeline'}
        </span>
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTest()}
              placeholder="Enter a test query..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              size="sm"
              onClick={handleTest}
              loading={loading}
              disabled={!query.trim()}
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Test
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {results.length} chunks retrieved
              </p>
              {results.map((chunk, i) => {
                const score = chunk.hybrid_score ?? chunk.vector_score ?? 0
                const isExpanded = expanded === i

                return (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpanded(isExpanded ? null : i)}
                    >
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">
                          {chunk.content.slice(0, 80)}...
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant="primary">
                            {(score * 100).toFixed(0)}% match
                          </Badge>
                          {chunk.chunk_type && chunk.chunk_type !== 'text' && (
                            <Badge variant="warning">{chunk.chunk_type}</Badge>
                          )}
                          {chunk.metadata?.file_name && (
                            <span className="text-xs text-gray-400 truncate">
                              {chunk.metadata.file_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      }
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                          {chunk.content}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          {chunk.vector_score !== undefined && (
                            <span>Vector: {(chunk.vector_score * 100).toFixed(0)}%</span>
                          )}
                          {chunk.keyword_score !== undefined && (
                            <span>Keyword: {(chunk.keyword_score * 100).toFixed(0)}%</span>
                          )}
                          {chunk.rerankScore !== undefined && (
                            <span>Rerank: {(chunk.rerankScore * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <p className="text-xs text-gray-400 text-center py-2">
              No results — try a different query or check your documents are processed
            </p>
          )}
        </div>
      )}
    </div>
  )
}