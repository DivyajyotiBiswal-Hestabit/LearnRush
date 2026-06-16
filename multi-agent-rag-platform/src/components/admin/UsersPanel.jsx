'use client'

import { useState, useEffect } from 'react'
import { Shield, User, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/Skeleton'

export function UsersPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users')
        if (!res.ok) {
          setError('Access denied or failed to load users')
          return
        }
        const data = await res.json()
        setUsers(data.users ?? [])
      } catch (err) {
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Shield className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          All Users ({users.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-4 px-5 py-3"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-indigo-700">
                  {user.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name ?? 'No name'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>

            {/* Role */}
            <Badge variant={user.role === 'admin' ? 'purple' : 'default'}>
              {user.role === 'admin' ? (
                <Shield className="w-3 h-3 mr-1" />
              ) : (
                <User className="w-3 h-3 mr-1" />
              )}
              {user.role ?? 'user'}
            </Badge>

            {/* Status */}
            {user.is_active !== false ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}

            {/* Usage */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium text-gray-700">
                {user.usage_queries_count ?? 0} queries
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}