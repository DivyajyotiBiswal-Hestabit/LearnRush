'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { MessageSquare, Users, Clock, Star, Target, Lightbulb, Database, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ScoreGauge({ value, label, color }) {
  const pct = (value / 10) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsClient({ data }) {
  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    )
  }

  const { summary, queryTrend, teamStats, recentScores } = data

  const hasData = summary.totalQueries > 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Performance insights for your research platform
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={MessageSquare}
          label="Total Queries"
          value={summary.totalQueries}
          sub={`${summary.completedQueries} completed`}
          color="indigo"
        />
        <StatCard
          icon={Users}
          label="Agent Teams"
          value={summary.totalTeams}
          sub={`${summary.totalSessions} sessions`}
          color="purple"
        />
        <StatCard
          icon={Database}
          label="Documents"
          value={summary.totalDocuments}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Avg Response"
          value={summary.avgProcessingTime > 0
            ? `${(summary.avgProcessingTime / 1000).toFixed(0)}s`
            : '—'
          }
          sub="per query"
          color="yellow"
        />
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No data yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Run some research queries to see analytics here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Queries Over Time
            </p>
            <p className="text-xs text-gray-400 mb-4">Last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={queryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => v.slice(5)}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Queries" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Average Scores */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">
              Average Scores
            </p>
            <div className="flex flex-col gap-4">
              <ScoreGauge
                label="Overall Quality"
                value={summary.avgQuality}
                color="bg-indigo-500"
              />
              <ScoreGauge
                label="Citation Accuracy"
                value={summary.avgCitation}
                color="bg-blue-500"
              />
              <ScoreGauge
                label="Insight Depth"
                value={summary.avgInsight}
                color="bg-purple-500"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-indigo-600">{summary.avgQuality}</p>
                <p className="text-xs text-gray-400">Quality</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{summary.avgCitation}</p>
                <p className="text-xs text-gray-400">Citation</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{summary.avgInsight}</p>
                <p className="text-xs text-gray-400">Insight</p>
              </div>
            </div>
          </div>

          {/* Score Trend */}
          {recentScores.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Score Trends
              </p>
              <p className="text-xs text-gray-400 mb-4">Last 10 completed queries</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={recentScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Quality"
                  />
                  <Line
                    type="monotone"
                    dataKey="citation"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Citation"
                  />
                  <Line
                    type="monotone"
                    dataKey="insight"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Insight"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Team Usage */}
          {teamStats.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4">
                Queries by Team
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={teamStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="queries" fill="#8b5cf6" radius={[0, 3, 3, 0]} name="Queries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}