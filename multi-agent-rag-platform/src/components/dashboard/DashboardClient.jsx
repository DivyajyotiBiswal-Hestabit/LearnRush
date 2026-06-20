'use client'

import { useState } from 'react'
import {
  Users, MessageSquare, Database, Plus, Layout,
  ArrowRight, TrendingUp, Zap, BookOpen,
} from 'lucide-react'

// ── Hover-safe stat card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, href }) {
  const [hovered, setHovered] = useState(false)

  const colorMap = {
    violet: { bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.2)',  icon: '#7C3AED', value: '#c4b5fd' },
    blue:   { bg: 'rgba(37,99,235,0.1)',   border: 'rgba(37,99,235,0.2)',   icon: '#2563EB', value: '#93c5fd' },
    green:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: '#10B981', value: '#6ee7b7' },
  }
  const c = colorMap[color] ?? colorMap.violet

  return (
    <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px',
          borderRadius: 12,
          border: `1px solid ${c.border}`,
          background: '#7ac7a7ff',
          transition: 'all 0.2s',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 8px 24px ${c.bg}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: `${c.icon}20`,
            border: `1px solid ${c.icon}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} style={{ color: c.icon }} />
          </div>
          <ArrowRight size={14} style={{ color: c.icon, opacity: 0.5 }} />
        </div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: '#1B4D3E', lineHeight: 1, marginBottom: 6 }}>
          {value}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#1B4D3E', marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#1B4D3E' }}>
          {sub}
        </p>
      </div>
    </a>
  )
}

// ── Quick action ──────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, href, accent }) {
  const [hovered, setHovered] = useState(false)

  const colors = {
    violet: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', icon: '#7C3AED', hover: 'rgba(124,58,237,0.18)' },
    blue:   { bg: 'rgba(37,99,235,0.1)',   border: 'rgba(37,99,235,0.2)',   icon: '#2563EB', hover: 'rgba(37,99,235,0.16)' },
    green:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: '#10B981', hover: 'rgba(16,185,129,0.16)' },
    amber:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: '#F59E0B', hover: 'rgba(245,158,11,0.16)' },
  }
  const c = colors[accent] ?? colors.violet

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px',
        borderRadius: 12,
        border: `1px solid ${c.border}`,
        background: hovered ? c.hover : c.bg,
        textDecoration: 'none',
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${c.icon}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={17} style={{ color: c.icon }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#3D4F68' }}>
          {desc}
        </p>
      </div>
      <ArrowRight size={14} style={{ color: c.icon, opacity: 0.5, flexShrink: 0 }} />
    </a>
  )
}

// ── Checklist item ────────────────────────────────────────────────────────
function ChecklistItem({ done, label, href }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          border: `1px solid ${hovered ? (done ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.25)') : '#1C2230'}`,
          background: done ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
          marginBottom: 6,
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: done ? 'none' : '1.5px solid #2A3A52',
          background: done ? '#10B981' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {done && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: done ? '#3D4F68' : '#94a3b8',
          textDecoration: done ? 'line-through' : 'none',
          flex: 1,
        }}>
          {label}
        </span>
        {!done && <ArrowRight size={12} style={{ color: '#2A3A52' }} />}
      </div>
    </a>
  )
}

// ── Query row ─────────────────────────────────────────────────────────────
function QueryRow({ score }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a href="/history" style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px',
          borderRadius: 8,
          border: `1px solid ${hovered ? 'rgba(124,58,237,0.25)' : '#1C2230'}`,
          background: 'rgba(255,255,255,0.01)',
          transition: 'all 0.15s',
        }}
      >
        <MessageSquare size={12} style={{ color: '#2A3A52', flexShrink: 0 }} />
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#64748b', flex: 1 }}>
          Research query
        </p>
        {score && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, fontWeight: 600,
            color: score >= 8 ? '#10B981' : score >= 6 ? '#F59E0B' : '#EF4444',
            flexShrink: 0,
          }}>
            {score}/10
          </span>
        )}
      </div>
    </a>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export function DashboardClient({ data }) {
  const { teamCount, queryCount, docCount, sessionCount, recentQueries, firstName } = data

  const avgScore = recentQueries.length > 0
    ? (recentQueries.reduce((s, q) => s + (q.quality_score ?? 0), 0) / recentQueries.length).toFixed(1)
    : null

  const checklist = [
    { label: 'Create an account',                    done: true,           href: '/profile' },
    { label: 'Create your first agent team',         done: teamCount > 0,  href: '/teams/new' },
    { label: 'Upload documents to knowledge base',   done: docCount > 0,   href: '/knowledge-base' },
    { label: 'Run your first research query',        done: queryCount > 0, href: '/chat' },
  ]
  const completedSteps = checklist.filter(c => c.done).length
  const allDone = completedSteps === checklist.length

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '32px 36px', maxWidth: 1100, color: '#94a3b8' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: '#1B4D3E' }}>
            Welcome back, {firstName}
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#3D4F68' }}>Your multi-agent research platform</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Users}         label="Agent Teams"  value={teamCount}  sub="Active research teams"  color='#00A693' href="/teams"          />
        <StatCard icon={MessageSquare} label="Queries Run"  value={queryCount} sub="Total research queries" color='#00A693'   href="/history"        />
        <StatCard icon={Database}      label="Documents"    value={docCount}   sub="In knowledge base"      color='#00A693'  href="/knowledge-base" />
      </div>

      {/* Body grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick actions */}
          <div style={{ borderRadius: 14, border: '1px solid #1C2230', background: '#c0a88bff', padding: '20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#1B4D3E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickAction icon={Plus}           label="New Agent Team"    desc="Create a custom multi-agent research team"  href="/teams/new"      accent="violet" />
              <QuickAction icon={MessageSquare}  label="Start Research"    desc="Ask a question with your agents"            href="/chat"           accent="blue"   />
              <QuickAction icon={Database}       label="Upload Documents"  desc="Add files to your knowledge base"           href="/knowledge-base" accent="green"  />
              <QuickAction icon={Layout}         label="Browse Templates"  desc="Start from a pre-built agent team"          href="/templates"      accent="amber"  />
            </div>
          </div>

          {/* Recent queries */}
          {recentQueries.length > 0 ? (
            <div style={{ borderRadius: 14, border: '1px solid #1C2230', background: '#9c856aff', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#1B4D3E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Recent Queries
                </p>
                <a href="/history" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#1B4D3E', textDecoration: 'none' }}>
                  view all →
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentQueries.map((q) => (
                  <QueryRow key={q.id} score={q.quality_score} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 14, border: '1px dashed #1C2230', padding: '36px 24px', textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#1B4D3E', border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <MessageSquare size={18} style={{ color: '#7C3AED' }} />
              </div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                No research queries yet
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#3D4F68', marginBottom: 16 }}>
                Create a team, upload some documents, and ask your first question
              </p>
              <a href="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>
                Start researching <ArrowRight size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Getting started */}
          {!allDone && (
            <div style={{ borderRadius: 14, border: '1px solid #1C2230', background: '#0C0F16', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Getting Started
                </p>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#7C3AED' }}>
                  {completedSteps}/{checklist.length}
                </span>
              </div>
              <div style={{ height: 3, background: '#1C2230', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(completedSteps / checklist.length) * 100}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #10B981)',
                  borderRadius: 2, transition: 'width 0.5s ease',
                }} />
              </div>
              {checklist.map((item, i) => (
                <ChecklistItem key={i} {...item} />
              ))}
            </div>
          )}

          {/* Platform overview */}
          <div style={{ borderRadius: 14, border: '1px solid #1C2230', background: '#c0a88bff', padding: '20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#1B4D3E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Platform Overview
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: Zap,         label: 'Research Sessions', value: sessionCount,                   color: '#00A693' },
                { icon: TrendingUp,  label: 'Avg Quality Score', value: avgScore ? `${avgScore}/10` : '—', color: '#00A693' },
                { icon: BookOpen,    label: 'Knowledge Docs',    value: docCount,                       color: '#00A693' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1C2230',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#1B4D3E', flex: 1 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#1B4D3E' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model status */}
          <div style={{ borderRadius: 14, border: '1px solid #1C2230', background: '#c0a88bff', padding: '20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Ollama Models
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { name: 'llama3:latest',   role: 'Researcher',  color: '#7C3AED' },
                { name: 'mistral:latest',  role: 'Critic',      color: '#E53E3E' },
                { name: 'phi3:latest',     role: 'Synthesizer', color: '#10B981' },
              ].map(m => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 7,
                  background: 'rgba(255,255,255,0.01)', border: '1px solid #1C2230',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#1B4D3E', flex: 1 }}>
                    {m.name}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#1B4D3E' }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#2A3A52', marginTop: 10 }}>
              + nomic-embed-text · embeddings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}