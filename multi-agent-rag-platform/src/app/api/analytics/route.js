import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all queries for this user
    const { data: queries } = await supabase
      .from('queries')
      .select('id, status, quality_score, citation_accuracy, insight_depth, processing_time_ms, created_at, team_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    // Fetch teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Fetch sessions
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id, created_at, total_queries')
      .eq('user_id', user.id)

    // Fetch documents
    const { data: documents } = await supabase
      .from('documents')
      .select('id, status, created_at')
      .eq('user_id', user.id)

    const completedQueries = queries?.filter(q => q.status === 'completed') ?? []

    // Queries per day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const queriesPerDay = {}
    queries?.forEach(q => {
      const date = new Date(q.created_at)
      if (date >= thirtyDaysAgo) {
        const key = date.toISOString().split('T')[0]
        queriesPerDay[key] = (queriesPerDay[key] ?? 0) + 1
      }
    })

    // Fill missing days with 0
    const queryTrend = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      queryTrend.push({ date: key, count: queriesPerDay[key] ?? 0 })
    }

    // Average scores
    const avgQuality = completedQueries.length > 0
      ? completedQueries.reduce((sum, q) => sum + (q.quality_score ?? 0), 0) / completedQueries.length
      : 0

    const avgCitation = completedQueries.length > 0
      ? completedQueries.reduce((sum, q) => sum + (q.citation_accuracy ?? 0), 0) / completedQueries.length
      : 0

    const avgInsight = completedQueries.length > 0
      ? completedQueries.reduce((sum, q) => sum + (q.insight_depth ?? 0), 0) / completedQueries.length
      : 0

    const avgProcessingTime = completedQueries.length > 0
      ? completedQueries.reduce((sum, q) => sum + (q.processing_time_ms ?? 0), 0) / completedQueries.length
      : 0

    // Queries per team
    const teamQueryCounts = {}
    queries?.forEach(q => {
      if (q.team_id) {
        teamQueryCounts[q.team_id] = (teamQueryCounts[q.team_id] ?? 0) + 1
      }
    })

    const teamStats = teams?.map(t => ({
      name: t.name,
      queries: teamQueryCounts[t.id] ?? 0,
    })) ?? []

    // Score trend (last 10 completed queries)
    const recentScores = completedQueries
      .slice(-10)
      .map((q, i) => ({
        index: i + 1,
        quality: q.quality_score ?? 0,
        citation: q.citation_accuracy ?? 0,
        insight: q.insight_depth ?? 0,
      }))

    return Response.json({
      summary: {
        totalQueries: queries?.length ?? 0,
        completedQueries: completedQueries.length,
        totalTeams: teams?.length ?? 0,
        totalSessions: sessions?.length ?? 0,
        totalDocuments: documents?.length ?? 0,
        avgQuality: Math.round(avgQuality * 10) / 10,
        avgCitation: Math.round(avgCitation * 10) / 10,
        avgInsight: Math.round(avgInsight * 10) / 10,
        avgProcessingTime: Math.round(avgProcessingTime),
      },
      queryTrend,
      teamStats,
      recentScores,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}