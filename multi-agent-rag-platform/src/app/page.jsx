'use client'

import { useEffect, useState } from 'react'

// ── Static Agent Pipeline Visual ─────────────────────────────────────────
function AgentPipeline() {
  const agents = [
    { name: 'Researcher', model: 'llama3', color: '#CC7F3B', bg: '#F5F5DC', border: 'rgba(124,58,237,0.3)', icon: '🔍', status: 'done', time: '249s' },
    { name: 'Critic', model: 'mistral', color: '#C19A6B', bg: '#F5F5DC', border: 'rgba(229,62,62,0.3)', icon: '🧠', status: 'done', time: '301s' },
    { name: 'Synthesizer', model: 'phi3', color: '#DAA06D', bg: '#F5F5DC', border: 'rgba(56,161,105,0.3)', icon: '✍️', status: 'active', time: null },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Query bubble */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: '#D0F0C0',
        border: '1px solid rgba(124,58,237,0.25)',
        marginBottom: 16,
      }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4F7942', lineHeight: 1.5 }}>
           &nbsp;"What are the key findings on attention mechanisms in transformer models?"
        </p>
      </div>

      {/* Agent cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.map((agent, i) => (
          <div key={i}>
            <div style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: agent.bg,
              border: `1px solid ${agent.border}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              {/* Left dot + connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: agent.status === 'active' ? 'transparent' : agent.color,
                  border: agent.status === 'active' ? `2px solid ${agent.color}` : 'none',
                  flexShrink: 0,
                }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#C46210' }}>
                    {agent.name}
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: `${agent.color}22`,
                    color: agent.color,
                    fontWeight: 500,
                  }}>
                    {agent.model}
                  </span>
                  {agent.status === 'done' && (
                    <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#38A169' }}>
                      ✓ {agent.time}
                    </span>
                  )}
                  {agent.status === 'active' && (
                    <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#D97706' }}>
                      thinking...
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'black', lineHeight: 1.55 }}>
                  {i === 0 && 'Retrieved 6 relevant chunks. Attention mechanisms allow models to weigh the relevance of input tokens when producing each output...'}
                  {i === 1 && "The researcher's analysis is sound but omits computational complexity trade-offs discussed in section 3.2..."}
                  {i === 2 && 'Combining outputs from both agents to produce final answer...'}
                </p>
              </div>
            </div>

            {/* Arrow connector between cards */}
            {i < agents.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 20px' }}>
                <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Score row */}
      <div style={{
        marginTop: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 8,
      }}>
        {[['Quality', '9.1', '#7C3AED'], ['Citations', '8.7', '#2563EB'], ['Insight', '8.9', '#38A169']].map(([k, v, c]) => (
          <div key={k} style={{
            padding: '10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: c }}>{v}</p>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#3D4F68', marginTop: 2 }}>{k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature card ────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      padding: '22px',
      borderRadius: 12,
      border: '1px solid #1C2230',
      background: '#EDC9AF',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1C2230'}
    >
      <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#00401A', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#3D4F68', lineHeight: 1.65 }}>
        {description}
      </p>
    </div>
  )
}

// ── Step ────────────────────────────────────────────────────────────────
function Step({ n, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(28, 177, 97, 0.15)',
        border: '1px solid rgba(124,58,237,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11, fontWeight: 700, color: '#8ae279ff',
      }}>
        {n}
      </div>
      <div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#1b5515ff', marginBottom: 4 }}>
          {title}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#357a50ff', lineHeight: 1.65 }}>
          {body}
        </p>
      </div>
    </div>
  )
}

// ── Template Row ────────────────────────────────────────────────────────
function TemplateRow({ icon, name, mode, desc }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href="/templates"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.3)' : '#1C2230'}`,
        background: hovered ? 'rgba(124,58,237,0.04)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
        cursor: 'pointer',
        marginBottom: 8,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14, fontWeight: 600,
          color: hovered ? '#ACE1AF' : '#00693E',
          transition: 'color 0.15s',
          marginBottom: 2,
        }}>
          {name}
        </p>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#2A3A52' }}>
          {mode} · {desc}
        </p>
      </div>
      <span style={{ color: hovered ? '#c4b5fd' : '#2A3A52', fontSize: 14, transition: 'all 0.15s', transform: hovered ? 'translateX(3px)' : 'none' }}>
        →
      </span>
    </a>
  )
}

// ── Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navBg = scrollY > 40

  return (
    <div style={{ background: '#F0FFF0', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111318; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111318; }
        ::-webkit-scrollbar-thumb { background: #1C2230; border-radius: 2px; }

        .btn-primary {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600;
          color: #fff; background: #a68a64;
          border: none; padding: 11px 24px;
          border-radius: 8px; cursor: pointer;
          transition: all 0.15s; text-decoration: none;
          display: inline-block;
        }
        .btn-primary:hover { background: #00693E; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

        .btn-ghost {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 500;
          color: #64748b; background: transparent;
          border: 1px solid #1C2230; padding: 11px 24px;
          border-radius: 8px; cursor: pointer;
          transition: all 0.15s; text-decoration: none;
          display: inline-block;
        }
        .btn-ghost:hover { border-color: rgba(124,58,237,0.4); color: #414833; }

        .nav-link {
          font-family: 'Inter', sans-serif;
          font-size: 18px; color: #414833;
          text-decoration: none; transition: color 0.15s;
        }
        .nav-link:hover { color: #013220; }

        .section { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.25s',
        background: navBg ? 'rgba(17,19,24,0.92)' : 'transparent',
        backdropFilter: navBg ? 'blur(14px)' : 'none',
        borderBottom: navBg ? '#D0F0C0' : '1px solid transparent',
      }}>
        <div className="section" style={{ display: 'flex', alignItems: 'center', height: 62 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #177245, #fdf0d5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>🤖</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#177245' }}>
              MultiAgent RAG
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 28, marginLeft: 44 }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#templates" className="nav-link">Templates</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/login" className="btn-ghost" style={{ padding: '8px 18px' }}>Sign in</a>
            <a href="/register" className="btn-primary" style={{ padding: '8px 18px' }}>Get started</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ paddingTop: 100 }}>
        <div className="section" style={{ paddingTop: 64, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* Left */}
            <div>
              {/* Eyebrow */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 12px', borderRadius: 100,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.08)',
                marginBottom: 24,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ACE1AF', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#27c593ff', letterSpacing: '0.06em' }}>
                  100% FREE · LOCAL · OPEN SOURCE
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 50, fontWeight: 700,
                color: '#7BA05B', lineHeight: 1.1,
                letterSpacing: '-0.02em', marginBottom: 20,
              }}>
                AI agents that<br />
                <span style={{ color: '#00563B' }}>debate</span> your<br />
                documents
              </h1>

              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16, color: '#475569',
                lineHeight: 1.7, marginBottom: 32, maxWidth: 400,
              }}>
                Upload a PDF. Ask a question. A Researcher, Critic, and Synthesizer — each running a different local LLM — collaborate to give you a better, traceable answer.
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
                <a href="/register" className="btn-primary">Start for free →</a>
                <a href="/templates" className="btn-ghost">Browse templates</a>
              </div>

              {/* Model list */}
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#2A3A52', letterSpacing: '0.06em', marginBottom: 10 }}>
                  WORKS WITH YOUR INSTALLED MODELS
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {[
                    { name: 'Llama 3', color: '#7C3AED' },
                    { name: 'Mistral 7B', color: '#2563EB' },
                    { name: 'Phi-3', color: '#059669' },
                    { name: 'Gemma 2', color: '#D97706' },
                    { name: 'Qwen 7B', color: '#DC2626' },
                  ].map(m => (
                    <span key={m.name} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 11px', borderRadius: 100,
                      border: '1px solid #1C2230',
                      background: 'rgba(255,255,255,0.02)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12, color: '#64748b',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Static agent pipeline */}
            <div style={{
              borderRadius: 16,
              border: '1px solid #1C2230',
              background: '#DAC8AE',
              padding: '24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#2A2A2A', '#2A2A2A', '#2A2A2A'].map((c, i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#2A3A52', marginLeft: 6 }}>
                  research session · sequential
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169' }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#38A169' }}>running</span>
                </div>
              </div>

              <AgentPipeline />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #1C2230', borderBottom: '1px solid #1C2230' }}>
        <div className="section">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { n: '5+', label: 'Local LLMs supported' },
              { n: '3', label: 'Collaboration modes' },
              { n: '5', label: 'Pre-built templates' },
              { n: '$0', label: 'API costs, forever' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '28px 0',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid #1C2230' : 'none',
              }}>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: '#4A5D23' }}>
                  {s.n}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#3D4F68', marginTop: 4 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features">
        <div className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#00563B', letterSpacing: '0.1em', marginBottom: 10 }}>
            WHAT MAKES IT DIFFERENT
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: '#00693E', marginBottom: 8, lineHeight: 1.2 }}>
            Research that thinks, debates, and decides
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#7BA05B', marginBottom: 40, maxWidth: 480, lineHeight: 1.7 }}>
            Not a single chatbot. A full team of specialized agents that collaborate, challenge each other, and synthesize better answers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { title: 'Multi-model intelligence', description: 'Each agent runs on a different LLM. Researcher on Llama 3, Critic on Mistral, Synthesizer on Phi-3. Best model for each job.' },
              { title: 'Hybrid RAG retrieval', description: 'Vector similarity + BM25 keyword search + reranking. Upload PDFs, images, and tables — agents actually read them.' },
              { title: 'Live collaboration trace', description: 'Watch every agent think in real time. See which model was used, what it retrieved, and how confident it is.' },
              { title: 'Three debate protocols', description: 'Sequential pipeline, Oxford-style debate, or hierarchical delegation. Pick the collaboration style that fits your question.' },
              { title: 'Fully local, fully free', description: 'Ollama runs every model on your machine. No API keys, no usage limits, no data leaving your network.' },
              { title: 'Scorecards & analytics', description: 'Every answer is scored for quality, citation accuracy, and insight depth. Track improvement over time with charts.' },
            ].map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{ borderTop: '1px solid #1C2230' }}>
        <div className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

            {/* Steps */}
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#414833', letterSpacing: '0.1em', marginBottom: 10 }}>
                HOW IT WORKS
              </p>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: '#1B4D3E', marginBottom: 36, lineHeight: 1.2 }}>
                From question to<br />
                <span style={{ color: '#7BA05B' }}>traceable answer</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Step n="1" title="Build your team" body="Pick from 5 pre-built templates or configure agents from scratch. Assign different LLMs to each agent role." />
                <Step n="2" title="Upload your knowledge base" body="Drop in PDFs, text files, or images. The pipeline chunks, embeds, and indexes everything automatically." />
                <Step n="3" title="Ask research questions" body="Your agents retrieve relevant context, debate the answer, and synthesize a final response — all locally." />
                <Step n="4" title="Review traces & scores" body="Every answer comes with a full agent trace, source citations, and a quality scorecard. Export as PDF or JSON." />
              </div>
            </div>

            {/* Mock terminal */}
            <div style={{
              borderRadius: 14,
              border: '1px solid #1C2230',
              background: '#baf7baff',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px',
                borderBottom: '1px solid #1C2230',
                background: '#1f7a50ff',
              }}>
                {['#2A2A2A', '#2A2A2A', '#2A2A2A'].map((c, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                ))}
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#022203ff', marginLeft: 8 }}>
                  research session · sequential mode
                </span>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Query */}
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(25, 61, 25, 0.1)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  marginBottom: 14,
                }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#072c08ff' }}>
                    "What are the key findings on attention mechanisms in transformer models?"
                  </p>
                </div>

                {/* Agent outputs */}
                {[
                  { name: 'Literature Researcher', model: 'llama3', color: '#CC7F3B', time: '38.2s', excerpt: 'Found 6 relevant chunks. Attention mechanisms allow models to focus on relevant parts of the input...' },
                  { name: 'Methodology Critic', model: 'mistral', color: '#C19A6B', time: '51.4s', excerpt: "The researcher's analysis is sound but omits computational complexity trade-offs..." },
                  { name: 'Academic Synthesizer', model: 'phi3', color: '#DAA06D', time: null, excerpt: null },
                ].map((agent, i) => (
                  <div key={i} style={{
                    marginBottom: 8, padding: '11px 14px',
                    borderRadius: 8,
                    border: `1px solid ${agent.time ? 'rgba(255,255,255,0.06)' : `${agent.color}30`}`,
                    background: agent.time ? 'rgba(255,255,255,0.02)' : `${agent.color}0A`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: agent.excerpt ? 6 : 0, flexWrap: 'wrap' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: agent.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: '#021a03ff' }}>
                        {agent.name}
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10, padding: '1px 7px', borderRadius: 4,
                        background: `${agent.color}18`, color: agent.color,
                      }}>
                        {agent.model}
                      </span>
                      {agent.time && (
                        <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#3D4F68' }}>
                          ⚡ {agent.time}
                        </span>
                      )}
                      {!agent.time && (
                        <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#D97706' }}>
                          thinking...
                        </span>
                      )}
                    </div>
                    {agent.excerpt && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#475569', lineHeight: 1.55 }}>
                        {agent.excerpt}
                      </p>
                    )}
                  </div>
                ))}

                {/* Scores */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 6, marginTop: 12,
                  padding: '11px',
                  borderRadius: 8,
                  border: '1px solid rgba(56,161,105,0.2)',
                  background: 'rgba(56,161,105,0.05)',
                }}>
                  {[['Quality', '9.1'], ['Citations', '8.7'], ['Insight', '8.9']].map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: '#38A169' }}>{v}</p>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#2A3A52' }}>{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ────────────────────────────────────────── */}
      <section id="templates" style={{ borderTop: '1px solid #1C2230' }}>
        <div className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#a68a64', letterSpacing: '0.1em', marginBottom: 10 }}>
                ONE-CLICK SETUP
              </p>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: '#00693E', marginBottom: 16, lineHeight: 1.2 }}>
                Pre-built teams for<br />every research domain
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>
                Each template ships with hand-crafted system prompts, the right model for each role, and the optimal collaboration mode — ready in one click.
              </p>
              <a href="/templates" className="btn-primary">Browse all templates →</a>
            </div>

            <div>
              {[
                { name: 'Academic Paper Analyzer', mode: 'sequential', desc: 'findings · methodology · synthesis' },
                { name: 'Business Strategy Advisor', mode: 'debate', desc: 'market analysis · risk · recommendations' },
                { name: 'Legal Document Reviewer', mode: 'sequential', desc: 'clause extraction · risk rating' },
                { name: 'Technical Support KB', mode: 'hierarchical', desc: 'troubleshooting · step-by-step solutions' },
                { name: 'Financial Report Summarizer', mode: 'sequential', desc: 'KPI extraction · bull/bear analysis' },
              ].map(t => <TemplateRow key={t.name} {...t} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #40826D' }}>
        <div className="section" style={{ paddingTop: 80, paddingBottom: 96 }}>
          <div style={{
            borderRadius: 20,
            border: '1px solid rgba(124,58,237,0.25)',
            background: 'rgba(25, 68, 14, 0.05)',
            padding: '56px 48px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle glow */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: 400, height: 200,
              background: 'radial-gradient(ellipse, rgba(44, 201, 65, 0.15) 0%, transparent 0%)',
              pointerEvents: 'none',
            }} />

            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 38, fontWeight: 700,
              color: '#00A693', lineHeight: 1.15,
              marginBottom: 14, position: 'relative',
            }}>
              Your documents deserve<br />
              <span style={{ color: '#40826D' }}>a team, not a chatbot.</span>
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15, color: '#475569',
              lineHeight: 1.7, marginBottom: 32,
              maxWidth: 440, margin: '0 auto 32px',
              position: 'relative',
            }}>
              No API keys. No cloud. No monthly bill. Just local LLMs collaborating on your research.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', position: 'relative' }}>
              <a href="/register" className="btn-primary">Create free account →</a>
              <a href="/login" className="btn-ghost">Sign in</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #40826D', padding: '24px 32px' }}>
        <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg, #177245, #fdf0d5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>🤖</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#3D4F68' }}>
              MultiAgent RAG
            </span>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#1C2230' }}>
            next.js · ollama · supabase · pgvector
          </p>
        </div>
      </footer>

    </div>
  )
}