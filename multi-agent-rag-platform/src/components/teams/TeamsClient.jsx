'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TeamCard } from '@/components/teams/TeamCard'

export function TeamsClient({ initialTeams }) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)

  function handleDelete(teamId) {
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Teams</h1>
          <p className="text-gray-500 text-sm mt-1">
            Build and manage your multi-agent research teams
          </p>
        </div>
        <Button onClick={() => router.push('/teams/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first multi-agent team to start running research queries."
          action={
            <Button onClick={() => router.push('/teams/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Team
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}