'use client'

import { useAuth } from '@/context/AuthContext'
import { useWorkflows } from '@/hooks/useWorkflows'
import { useExecutions } from '@/hooks/useExecutions'
import { useAnalytics } from '@/hooks/useAnalytics'
import {
  GitBranch, History, CheckCircle,
  Clock, ArrowRight, Plus, Zap,
  TrendingUp, Star, Download
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b']

function StatCard({ label, value, icon: Icon, color, bg, suffix }) {
  return (
    <div className="bg-accent border border-[#2e2e4e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#a0a0b8] text-sm">{label}</span>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}{suffix}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { workflows } = useWorkflows()
  const { executions } = useExecutions()
  const { analytics, loading } = useAnalytics()

  const userName = user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] || 'there'

  const exportCSV = () => {
    if (!analytics) return
    const rows = [
      ['Date', 'Executions'],
      ...analytics.inquiriesOverTime.map(d => [d.date, d.count])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics-report.csv'
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-accent">
            Welcome, {userName} 
          </h1>
          <p className="text-accent text-m mt-1">
            Here's your automation performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 border border-[#2e2e4e] text-accent hover:text-accent px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
          <Link
            href="/dashboard/workflows/create"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Workflow
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Workflows"
          value={workflows.length}
          icon={GitBranch}
          color="text-white"
          bg="bg-accent/10"
        />
        <StatCard
          label="Total Executions"
          value={analytics?.overview?.total || 0}
          icon={History}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard
          label="Success Rate"
          value={analytics?.overview?.successRate || 0}
          suffix="%"
          icon={CheckCircle}
          color="text-white"
          bg="bg-success/10"
        />
        <StatCard
          label="Avg Score"
          value={analytics?.overview?.avgScore || '—'}
          suffix={analytics?.overview?.avgScore ? '/10' : ''}
          icon={Star}
          color="text-warning"
          bg="bg-warning/10"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Inquiries over time */}
        <div className="lg:col-span-2 bg-surface border border-[#2e2e4e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-m">Inquiries Over Time</h2>
            <span className="text-white text-s">Last 14 days</span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics?.inquiriesOverTime || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#000803ff" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#4e4e6e', fontSize: 15 }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fill: '#4e4e6e', fontSize: 15 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #2e2e4e',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inquiry types */}
        <div className="bg-[#01796F] border border-[#2e2e4e] rounded-xl p-5">
          <h2 className="text-white font-semibold text-m mb-4">Inquiry Types</h2>
          {loading || !analytics?.inquiryTypes?.length ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <p className="text-[#4e4e6e] text-xs">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={analytics.inquiryTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="count"
                    nameKey="type"
                  >
                    {analytics.inquiryTypes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid #2e2e4e',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {analytics.inquiryTypes.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-white text-xs capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-white text-s font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Recent workflows */}
        <div className="bg-surface border border-[#2e2e4e] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e4e]">
            <h2 className="text-white font-semibold text-m">Recent Workflows</h2>
            <Link
              href="/dashboard/workflows"
              className="flex items-center gap-1 text-accent text-s hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <GitBranch size={22} className="text-white mb-3" />
              <p className="text-white text-sm font-medium mb-1">No workflows yet</p>
              <Link
                href="/dashboard/workflows/create"
                className="flex items-center gap-1.5 text-accent text-xs font-medium hover:underline mt-2"
              >
                <Plus size={13} />
                Create workflow
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#2e2e4e]">
              {workflows.slice(0, 4).map(wf => (
                <Link
                  key={wf.id}
                  href={`/dashboard/workflows/${wf.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white transition-colors"
                >
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <GitBranch size={14} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-accent text-m font-medium truncate">{wf.name}</p>
                    <p className="text-[#4e4e6e] text-xs capitalize">{wf.trigger_channel}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    wf.status === 'active' ? 'bg-success' : 'bg-[#4e4e6e]'
                  }`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent executions */}
        <div className="bg-surface border border-[#2e2e4e] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e4e]">
            <h2 className="text-white font-semibold text-m">Recent Executions</h2>
            <Link
              href="/dashboard/executions"
              className="flex items-center gap-1 text-accent text-s hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <History size={22} className="text-[#4e4e6e] mb-3" />
              <p className="text-white text-sm font-medium mb-1">No executions yet</p>
              <p className="text-[#a0a0b8] text-xs">Trigger a workflow to see history</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2e2e4e]">
              {executions.slice(0, 5).map(ex => (
                <Link
                  key={ex.id}
                  href={`/dashboard/executions/${ex.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ex.status === 'completed' ? 'bg-success' :
                    ex.status === 'failed' ? 'bg-error' :
                    ex.status === 'running' ? 'bg-blue-400 animate-pulse' :
                    'bg-warning'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-accent text-m truncate">
                      {ex.original_message?.substring(0, 50)}...
                    </p>
                    <p className="text-[#4e4e6e] text-xs capitalize">{ex.status}</p>
                  </div>
                  <ArrowRight size={12} className="text-[#4e4e6e]" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Getting started banner */}
      {workflows.length === 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Get started in 3 steps</p>
              <p className="text-[#a0a0b8] text-xs mt-0.5">
                Connect Gmail → Create workflow → Watch agents work
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/integrations"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          >
            Connect now
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

    </div>
  )
}