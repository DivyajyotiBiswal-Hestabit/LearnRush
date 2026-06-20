'use client'

import { useState } from 'react'

// ── Section label ─────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, color: '#2A3A52',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      marginBottom: 14,
    }}>{children}</p>
  )
}

// ── Page header ───────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
      <div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 4,
        }}>{title}</h1>
        {subtitle && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#3D4F68' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Dark card ─────────────────────────────────────────────────────────────
export function DarkCard({ children, style = {}, hover = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        borderRadius: 12, border: `1px solid ${hovered ? 'rgba(124,58,237,0.3)' : '#1a2234'}`,
        background: '#0C0F16', padding: '20px',
        transition: 'all 0.2s',
        transform: hover && hovered ? 'translateY(-1px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Dark button ───────────────────────────────────────────────────────────
export function DarkButton({ children, onClick, href, variant = 'primary', size = 'md', disabled = false, loading = false, style = {} }) {
  const [hovered, setHovered] = useState(false)

  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
    borderRadius: 8,
  }

  const sizes = {
    sm: { padding: '7px 14px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 13 },
    lg: { padding: '11px 24px', fontSize: 14 },
  }

  const variants = {
    primary: {
      background: hovered ? '#6D28D9' : '#7C3AED',
      color: '#fff',
      boxShadow: hovered ? '0 4px 16px rgba(124,58,237,0.4)' : 'none',
    },
    ghost: {
      background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: hovered ? '#94a3b8' : '#475569',
      border: '1px solid #1a2234',
    },
    danger: {
      background: hovered ? '#dc2626' : 'rgba(239,68,68,0.1)',
      color: hovered ? '#fff' : '#ef4444',
      border: '1px solid rgba(239,68,68,0.2)',
    },
  }

  const props = {
    style: { ...base, ...sizes[size], ...variants[variant], ...style },
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onClick: disabled ? undefined : onClick,
  }

  if (href) return <a href={href} {...props}>{loading ? '...' : children}</a>
  return <button {...props}>{loading ? '...' : children}</button>
}

// ── Dark input ────────────────────────────────────────────────────────────
export function DarkInput({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: '#475569' }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', padding: '9px 12px',
          background: '#0A0D13', border: `1px solid ${error ? '#ef4444' : '#1a2234'}`,
          borderRadius: 8, color: '#CBD5E1',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          outline: 'none', transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={e => e.target.style.borderColor = '#7C3AED'}
        onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#1a2234'}
        {...props}
      />
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

// ── Dark select ───────────────────────────────────────────────────────────
export function DarkSelect({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: '#475569' }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', padding: '9px 12px',
          background: '#0A0D13', border: `1px solid ${error ? '#ef4444' : '#1a2234'}`,
          borderRadius: 8, color: '#CBD5E1',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          outline: 'none', cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

// ── Dark badge ────────────────────────────────────────────────────────────
export function DarkBadge({ children, color = 'default' }) {
  const colors = {
    default:  { bg: 'rgba(255,255,255,0.06)', text: '#475569', border: '#1a2234' },
    violet:   { bg: 'rgba(124,58,237,0.15)',  text: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
    blue:     { bg: 'rgba(37,99,235,0.15)',   text: '#60a5fa', border: 'rgba(37,99,235,0.3)' },
    green:    { bg: 'rgba(16,185,129,0.15)',  text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    red:      { bg: 'rgba(239,68,68,0.15)',   text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    amber:    { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    purple:   { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  }
  const c = colors[color] ?? colors.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, fontWeight: 500,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export function DarkEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      {Icon && (
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Icon size={20} color="#7C3AED" />
        </div>
      )}
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#3D4F68', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── Mono label ────────────────────────────────────────────────────────────
export function MonoLabel({ children, color = '#2A3A52' }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, color, letterSpacing: '0.08em',
    }}>
      {children}
    </span>
  )
}