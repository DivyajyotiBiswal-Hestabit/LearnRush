import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'
export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all data directly
  const [queriesRes, teamsRes, sessionsRes, documentsRes] = await Promise.all([
    supabase
      .from('queries')
      .select('id, status, quality_score, citation_accuracy, insight_depth, processing_time_ms, created_at, team_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('teams')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('chat_sessions')
      .select('id, created_at, total_queries')
      .eq('user_id', user.id),
    supabase
      .from('documents')
      .select('id, status, created_at')
      .eq('user_id', user.id),
  ])

  const queries = queriesRes.data ?? []
  const teams = teamsRes.data ?? []
  const completedQueries = queries.filter(q => q.status === 'completed')

  // Build query trend (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const queriesPerDay = {}
  queries.forEach(q => {
    const date = new Date(q.created_at)
    if (date >= thirtyDaysAgo) {
      const key = date.toISOString().split('T')[0]
      queriesPerDay[key] = (queriesPerDay[key] ?? 0) + 1
    }
  })

  const queryTrend = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    queryTrend.push({ date: key, count: queriesPerDay[key] ?? 0 })
  }

  const avg = (arr, key) => arr.length > 0
    ? Math.round((arr.reduce((s, q) => s + (q[key] ?? 0), 0) / arr.length) * 10) / 10
    : 0

  const teamQueryCounts = {}
  queries.forEach(q => {
    if (q.team_id) teamQueryCounts[q.team_id] = (teamQueryCounts[q.team_id] ?? 0) + 1
  })

  const analyticsData = {
    summary: {
      totalQueries: queries.length,
      completedQueries: completedQueries.length,
      totalTeams: teams.length,
      totalSessions: sessionsRes.data?.length ?? 0,
      totalDocuments: documentsRes.data?.length ?? 0,
      avgQuality: avg(completedQueries, 'quality_score'),
      avgCitation: avg(completedQueries, 'citation_accuracy'),
      avgInsight: avg(completedQueries, 'insight_depth'),
      avgProcessingTime: avg(completedQueries, 'processing_time_ms'),
    },
    queryTrend,
    teamStats: teams.map(t => ({
      name: t.name,
      queries: teamQueryCounts[t.id] ?? 0,
    })),
    recentScores: completedQueries.slice(-10).map((q, i) => ({
      index: i + 1,
      quality: q.quality_score ?? 0,
      citation: q.citation_accuracy ?? 0,
      insight: q.insight_depth ?? 0,
    })),
  }

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  return (
    <AppLayout user={appUser}>
      <AnalyticsClient data={analyticsData} />
    </AppLayout>
  )
}