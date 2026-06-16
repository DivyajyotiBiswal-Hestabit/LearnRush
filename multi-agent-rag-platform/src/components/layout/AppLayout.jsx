'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Users,
  Database,
  MessageSquare,
  History,
  BarChart2,
  User,
  LogOut,
  Menu,
  X,
  Bot,
  Layout,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Agent Teams', href: '/teams', icon: Users },
  { label: 'Templates', href: '/templates', icon: Layout },       
  { label: 'Knowledge Base', href: '/knowledge-base', icon: Database },
  { label: 'Research Chat', href: '/chat', icon: MessageSquare },
  { label: 'History', href: '/history', icon: History },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Profile', href: '/profile', icon: User },
]

export function AppLayout({ children, user }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">MultiAgent RAG</p>
          <p className="text-xs text-gray-400">Research Platform</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-indigo-600' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          {/* Replace the initials-only avatar with this: */}
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold overflow-hidden flex-shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.fullName ?? 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900">MultiAgent RAG</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}