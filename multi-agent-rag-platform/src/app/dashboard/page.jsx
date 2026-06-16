import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import Link from 'next/link'
import { Users, MessageSquare, Database, Plus, Layout } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch real counts
  const [teamsRes, queriesRes, docsRes] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('queries').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const appUser = {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? 'User',
    avatarUrl: profile?.avatar_url ?? null,
  }

  const stats = [
    {
      label: 'Agent Teams',
      value: teamsRes.count ?? 0,
      desc: 'Active research teams',
      icon: Users,
      href: '/teams',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Queries Run',
      value: queriesRes.count ?? 0,
      desc: 'Total research queries',
      icon: MessageSquare,
      href: '/history',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Documents',
      value: docsRes.count ?? 0,
      desc: 'In knowledge base',
      icon: Database,
      href: '/knowledge-base',
      color: 'bg-green-50 text-green-600',
    },
  ]

  return (
    <AppLayout user={appUser}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {appUser.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Your multi-agent research platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/teams/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Agent Team
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start Research
            </Link>
            <Link
              href="/knowledge-base"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Database className="w-4 h-4" />
              Upload Documents
            </Link>

            <Link
              href="/templates"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Layout className="w-4 h-4" />
              Browse Templates
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}