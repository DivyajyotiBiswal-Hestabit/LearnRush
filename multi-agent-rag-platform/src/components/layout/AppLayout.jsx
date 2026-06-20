'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Database, MessageSquare,
  History, BarChart2, User, LogOut, Menu, Layout,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',     href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Agent Teams',   href: '/teams',           icon: Users },
  { label: 'Templates',     href: '/templates',       icon: Layout },
  { label: 'Knowledge Base',href: '/knowledge-base',  icon: Database },
  { label: 'Research Chat', href: '/chat',             icon: MessageSquare },
  { label: 'History',       href: '/history',          icon: History },
  { label: 'Analytics',     href: '/analytics',        icon: BarChart2 },
  { label: 'Profile',       href: '/profile',          icon: User },
]

export function AppLayout({ children, user }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = () => (
    <div style={{
      width: 220, height: '100%',
      background: '#ACE1AF',
      borderRight: '1px solid #1a2234',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #1a2234' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, flexShrink: 0,
          }}>🤖</div>
          <div>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2,
            }}>MultiAgent RAG</p>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, color: '#2A3A52', letterSpacing: '0.05em',
            }}>Research Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 7, marginBottom: 1,
                textDecoration: 'none',
                background: active ? '#00563B' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,58,237,0.25)' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} color={active ? '#a78bfa' : '#334155'} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? 'white' : '#475569',
              }}>{label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 4, height: 4,
                  borderRadius: '50%', background: '#00563B',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #1a2234' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 10px', borderRadius: 8, marginBottom: 4,
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2234',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden',
          }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user?.fullName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName ?? 'User'}
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#1e2d40', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '8px 10px', borderRadius: 7,
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#334155',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155' }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
        @media (min-width: 768px) {
          .mobile-topbar { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#111318', overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{ flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 220, zIndex: 10 }}>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Mobile topbar */}
          <div className="mobile-topbar" style={{
            display: 'none', alignItems: 'center', gap: 12,
            padding: '0 16px', height: 52,
            background: '#0A0D13', borderBottom: '1px solid #1a2234', flexShrink: 0,
          }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <Menu size={19} />
            </button>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
              MultiAgent RAG
            </span>
          </div>

          <main style={{ flex: 1, overflowY: 'auto', background: '#F0FFF0', padding: '32px'}}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}