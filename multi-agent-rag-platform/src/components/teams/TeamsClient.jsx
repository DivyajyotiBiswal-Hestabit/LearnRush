'use client'
import { Layout } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TeamCard } from '@/components/teams/TeamCard'

export function TeamsClient({ initialTeams }) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)

  function handleDelete(teamId) {
    setTeams(prev => prev.filter(t => t.id !== teamId))
    toast.success('Team deleted successfully')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4D3E]">Agent Teams</h1>
          <p className="text-gray-500 text-sm mt-1">
            Build and manage your multi-agent research teams
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/templates')}
          >
            <Layout className="w-4 h-4 mr-2" />
            Browse Templates
          </Button>
          <Button onClick={() => router.push('/teams/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Team
          </Button>
        </div>
      </div>


      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Start from a pre-built template or create a custom team from scratch."
          action={
            <div className="flex gap-3">
              <Button onClick={() => router.push('/templates')}>
                <Layout className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
              <Button variant="outline" onClick={() => router.push('/teams/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Custom Team
              </Button>
            </div>
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