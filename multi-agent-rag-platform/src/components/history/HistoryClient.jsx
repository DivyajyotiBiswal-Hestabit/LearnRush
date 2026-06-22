'use client'

import { useState } from 'react'
import { History, Search, Filter } from 'lucide-react'
import { QueryCard } from '@/components/history/QueryCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { exportAsJSON, exportAsPDF } from '@/lib/utils/export'

const STATUS_FILTERS = ['all', 'completed', 'failed', 'processing']

export function HistoryClient({ initialQueries }) {
  const [queries, setQueries] = useState(initialQueries)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const filtered = queries.filter(q => {
    const matchesSearch = !search ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.final_answer?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter

    return matchesSearch && matchesStatus
  })

  async function loadMore() {
    setLoading(true)
    try {
      const res = await fetch(`/api/history?offset=${queries.length}&limit=20`)
      const data = await res.json()
      if (data.queries?.length) {
        setQueries(prev => [...prev, ...data.queries])
      }
    } catch (err) {
      console.error('Load more failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#004225]">Research History</h1>
        <p className="text-gray-500 text-sm mt-1">
          {queries.length} total queries — click any to view full trace
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search queries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-small rounded-lg capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-[#004225] text-white'
                  : 'bg-white border border-gray-200 text-white hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Query List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={search ? 'No matching queries' : 'No research history yet'}
          description={
            search
              ? 'Try a different search term'
              : 'Start a research session to see your history here'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(query => (
            <QueryCard
              key={query.id}
              query={query}
              onExportJSON={exportAsJSON}
              onExportPDF={exportAsPDF}
            />
          ))}

          {queries.length >= 30 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                loading={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}