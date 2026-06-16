'use client'

import { MessageSquare, FileText, Users, TrendingUp } from 'lucide-react'

function UsageBar({ used, limit, color }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isNearLimit = pct >= 80
  const isAtLimit = pct >= 100

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs font-medium ${
          isAtLimit ? 'text-red-600' :
          isNearLimit ? 'text-yellow-600' :
          'text-gray-600'
        }`}>
          {used} / {limit}
        </span>
        <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

export function UsageTracker({ profile }) {
  const usageItems = [
    {
      label: 'Research Queries',
      icon: MessageSquare,
      used: profile.usage_queries_count ?? 0,
      limit: profile.usage_queries_limit ?? 100,
      color: 'bg-indigo-500',
      desc: 'Queries run across all sessions',
    },
    {
      label: 'Documents',
      icon: FileText,
      used: profile.usage_documents_count ?? 0,
      limit: profile.usage_documents_limit ?? 50,
      color: 'bg-green-500',
      desc: 'Files uploaded to knowledge base',
    },
    {
      label: 'Agent Teams',
      icon: Users,
      used: profile.usage_teams_count ?? 0,
      limit: profile.usage_teams_limit ?? 10,
      color: 'bg-purple-500',
      desc: 'Active teams created',
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Usage Limits</h3>
        <span className="ml-auto text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
          {profile.role === 'admin' ? 'Admin' : 'Free Plan'}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {usageItems.map(item => (
          <div key={item.label}>
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
            <UsageBar
              used={item.used}
              limit={item.limit}
              color={item.color}
            />
            <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}