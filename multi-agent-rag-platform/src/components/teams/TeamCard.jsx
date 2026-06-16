'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash2, MessageSquare, Bot, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/format'

const MODE_COLORS = {
  sequential: 'blue',
  debate: 'warning',
  hierarchical: 'purple',
}

const ROLE_COLORS = {
  researcher: 'primary',
  critic: 'danger',
  synthesizer: 'success',
  analyst: 'purple',
  general: 'default',
}

export function TeamCard({ team, onDelete }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      onDelete(team.id)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {team.name}
            </h3>
            <Badge variant={MODE_COLORS[team.collaboration_mode] ?? 'default'}>
              {team.collaboration_mode}
            </Badge>
          </div>
          {team.research_domain && (
            <p className="text-xs text-gray-400 mt-0.5">{team.research_domain}</p>
          )}
          {team.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{team.description}</p>
          )}
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/teams/${team.id}/edit`) }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Team
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(`/teams/${team.id}/config`)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Advanced Config
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agents */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Agents ({team.agents?.length ?? 0})
        </p>
        <div className="flex flex-col gap-1">
          {team.agents?.map(agent => (
            <div key={agent.id} className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">{agent.name}</span>
              <Badge variant={ROLE_COLORS[agent.role] ?? 'default'}>
                {agent.role}
              </Badge>
              <span className="text-xs text-gray-400 ml-auto truncate">
                {agent.model_id.replace(':latest', '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">Created {formatDate(team.created_at)}</p>
        <button
          onClick={() => router.push(`/chat?team=${team.id}`)}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Start Research
        </button>
      </div>
    </div>
  )
}