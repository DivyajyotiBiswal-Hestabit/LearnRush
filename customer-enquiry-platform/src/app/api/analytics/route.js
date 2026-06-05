import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all executions for user
    const { data: executions } = await supabaseAdmin
      .from('executions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true })

    // Get all scorecards
    const { data: scorecards } = await supabaseAdmin
      .from('scorecards')
      .select('*, executions!inner(user_id)')
      .eq('executions.user_id', user.id)

    const total = executions?.length || 0
    const completed = executions?.filter(e => e.status === 'completed').length || 0
    const failed = executions?.filter(e => e.status === 'failed').length || 0

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const avgDuration = executions?.filter(e => e.duration_ms).length > 0
      ? Math.round(
          executions
            .filter(e => e.duration_ms)
            .reduce((sum, e) => sum + e.duration_ms, 0) /
          executions.filter(e => e.duration_ms).length / 1000
        )
      : 0

    const avgScore = scorecards?.length > 0
      ? Math.round(
          scorecards.reduce((sum, s) => sum + s.overall_score, 0) / scorecards.length * 10
        ) / 10
      : 0

    // Inquiries over time (last 14 days)
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = executions?.filter(e =>
        e.started_at?.startsWith(dateStr)
      ).length || 0
      last14Days.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      })
    }

    // Most common inquiry types from classifier outputs
    const { data: classifierLogs } = await supabaseAdmin
      .from('execution_logs')
      .select('output, execution_id')
      .eq('agent_role', 'classifier')

    const typeCounts = {}
    classifierLogs?.forEach(log => {
      try {
        const result = log.output?.result
        if (result) {
          const parsed = typeof result === 'string' ? JSON.parse(result) : result
          const category = parsed.category || 'general_inquiry'
          typeCounts[category] = (typeCounts[category] || 0) + 1
        }
      } catch (e) {}
    })

    const inquiryTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Weekly data for chart
    const last7Days = last14Days.slice(-7)

    return NextResponse.json({
      overview: {
        total,
        completed,
        failed,
        successRate,
        avgDuration,
        avgScore
      },
      inquiriesOverTime: last14Days,
      weeklyData: last7Days,
      inquiryTypes,
      recentScores: scorecards?.slice(-10).map(s => ({
        date: s.created_at,
        score: s.overall_score
      })) || []
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}