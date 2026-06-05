'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap,
  LayoutDashboard,
  GitBranch,
  History,
  Plug,
  LayoutTemplate,
  Settings,
  ChevronRight
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Workflows',
    href: '/dashboard/workflows',
    icon: GitBranch,
  },
  {
    label: 'Executions',
    href: '/dashboard/executions',
    icon: History,
  },
  {
    label: 'Integrations',
    href: '/dashboard/integrations',
    icon: Plug,
  },
  {
    label: 'Templates',
    href: '/dashboard/templates',
    icon: LayoutTemplate,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 h-screen bg-surface border-r border-[#2e2e4e] flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2e2e4e]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">FlowAgent</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Main nav label */}
        <p className="text-[#4e4e6e] text-xs font-medium uppercase tracking-wider px-3 mb-3">
          Main Menu
        </p>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-accent text-white'
                  : 'text-[#a0a0b8] hover:bg-[#16213e] hover:text-white'
                }
              `}
            >
              <Icon
                size={17}
                className={isActive ? 'text-white' : 'text-[#a0a0b8] group-hover:text-white'}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-white opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-[#2e2e4e]">
        <div className="bg-[#0f0f17] rounded-lg px-3 py-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-xs text-[#a0a0b8] font-medium">n8n Connected</span>
          </div>
          <p className="text-[#4e4e6e] text-xs">localhost:5678</p>
        </div>
      </div>

    </aside>
  )
}