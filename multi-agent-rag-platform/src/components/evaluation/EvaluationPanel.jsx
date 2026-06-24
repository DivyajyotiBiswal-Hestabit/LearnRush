'use client'

import { useState } from 'react'
import {
  FlaskConical, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Loader, Info,
} from 'lucide-react'

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  if (score === null || score === undefined) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '3px solid #1a2234',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10, color: '#334155',
        }}>N/A</span>
      </div>
    )
  }

  const pct = Math.round(score * 100)
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : pct >= 40 ? '#F97316' : '#EF4444'
  const circumference = 2 * Math.PI * 22
  const strokeDash = (pct / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={22}
          fill="none" stroke="#1a2234" strokeWidth={3} />
        {/* Score ring */}
        <circle cx={size/2} cy={size/2} r={22}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700, color,
        }}>
          {pct}%
        </span>
      </div>
    </div>
  )
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ title, description, result, details }) {
  const [expanded, setExpanded] = useState(false)

  const color = !result?.score ? '#334155'
    : result.score >= 0.8 ? '#10B981'
    : result.score >= 0.6 ? '#F59E0B'
    : result.score >= 0.4 ? '#F97316'
    : '#EF4444'

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${expanded ? color + '40' : '#1a2234'}`,
      background: expanded ? color + '08' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => result && setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          cursor: result ? 'pointer' : 'default',
        }}
      >
        <ScoreRing score={result?.score} size={48} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 600, color: '#CBD5E1',
            marginBottom: 2,
          }}>
            {title}
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11, color: '#334155', lineHeight: 1.4,
          }}>
            {description}
          </p>
          {result?.label && result.label !== 'N/A' && result.label !== 'Error' && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, color,
              marginTop: 3, display: 'inline-block',
            }}>
              {result.label}
            </span>
          )}
        </div>

        {result && (
          expanded
            ? <ChevronUp size={14} style={{ color: '#334155', flexShrink: 0 }} />
            : <ChevronDown size={14} style={{ color: '#334155', flexShrink: 0 }} />
        )}
      </div>

      {/* Expanded details */}
      {expanded && result && (
        <div style={{
          padding: '10px 14px 14px',
          borderTop: `1px solid ${color}20`,
        }}>
          {/* Reason */}
          {result.reason && (
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12, color: '#64748b',
              lineHeight: 1.6, marginBottom: 10,
            }}>
              {result.reason}
            </p>
          )}

          {/* Faithfulness claims */}
          {result.claims?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, color: '#2A3A52',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Claims checked ({result.supported}/{result.total})
              </p>
              {result.claims.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  padding: '5px 8px', borderRadius: 6,
                  background: c.supported ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${c.supported ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                  {c.supported
                    ? <CheckCircle size={10} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                    : <AlertCircle size={10} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  }
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                  }}>
                    {c.claim}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Context recall statements */}
          {result.statements?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, color: '#2A3A52',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Statements ({result.attributable}/{result.total} in context)
              </p>
              {result.statements.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  padding: '5px 8px', borderRadius: 6,
                  background: s.in_context ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${s.in_context ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                  {s.in_context
                    ? <CheckCircle size={10} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                    : <AlertCircle size={10} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  }
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                  }}>
                    {s.statement}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Context precision chunk evals */}
          {result.chunkEvals?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, color: '#2A3A52',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Chunks ({result.useful}/{result.total} useful)
              </p>
              {result.chunkEvals.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  padding: '5px 8px', borderRadius: 6,
                  background: c.useful ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${c.useful ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                  {c.useful
                    ? <CheckCircle size={10} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                    : <AlertCircle size={10} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  }
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                  }}>
                    Chunk {c.chunk_num}: {c.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Generated questions for relevance */}
          {result.generatedQuestions?.length > 0 && (
            <div>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, color: '#2A3A52',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                Questions this answer addresses
              </p>
              {result.generatedQuestions.map((q, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10, color: '#7C3AED', flexShrink: 0,
                  }}>
                    Q{i + 1}
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                  }}>
                    {q}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main evaluation panel ──────────────────────────────────────────────────
export function EvaluationPanel({ queryId, initialEvaluation = null }) {
  const [evaluation, setEvaluation] = useState(initialEvaluation)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  async function runEvaluation() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Evaluation failed')
        return
      }

      setEvaluation(data.evaluation)
      setVisible(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const METRICS = evaluation ? [
    {
      title: 'Faithfulness',
      description: 'Are the claims in the answer grounded in the source documents?',
      result: evaluation.faithfulness,
    },
    {
      title: 'Answer Relevance',
      description: 'Does the answer actually address what was asked?',
      result: evaluation.answerRelevance,
    },
    {
      title: 'Context Recall',
      description: 'Did the retrieved context contain all info needed to answer?',
      result: evaluation.contextRecall,
    },
    {
      title: 'Context Precision',
      description: 'Were the retrieved chunks actually useful for this answer?',
      result: evaluation.contextPrecision,
    },
  ] : []

  return (
    <div style={{ marginTop: 8 }}>

      {/* Toggle button — only shown when evaluation not yet run */}
      {!evaluation && !loading && (
        <button
          onClick={runEvaluation}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 12px', borderRadius: 7,
            border: '1px solid #1a2234',
            background: 'transparent',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, color: '#475569',
            cursor: 'pointer', transition: 'all 0.15s',
            width: '100%', justifyContent: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
            e.currentTarget.style.color = '#a78bfa'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1a2234'
            e.currentTarget.style.color = '#475569'
          }}
        >
          <FlaskConical size={12} />
          Evaluate this answer
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 8,
          border: '1px solid rgba(124,58,237,0.2)',
          background: 'rgba(124,58,237,0.05)',
        }}>
          <Loader size={13} style={{ color: '#7C3AED', animation: 'spin 1s linear infinite' }} />
          <div>
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, color: '#a78bfa',
            }}>
              Running 4 evaluation metrics...
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11, color: '#334155', marginTop: 2,
            }}>
              Faithfulness · Relevance · Context Recall · Context Precision
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: '#f87171',
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {evaluation && (
        <div>
          {/* Overall score header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(124,58,237,0.25)',
            background: 'rgba(124,58,237,0.06)',
            marginBottom: 8,
            cursor: 'pointer',
          }}
            onClick={() => setVisible(v => !v)}
          >
            <FlaskConical size={14} style={{ color: '#7C3AED' }} />
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 12, fontWeight: 600, color: '#c4b5fd',
              }}>
                RAG Evaluation
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10, color: '#475569',
              }}>
                Overall: {evaluation.overallLabel} ({evaluation.overallScore !== null
                  ? `${Math.round(evaluation.overallScore * 100)}%`
                  : 'N/A'
                })
              </p>
            </div>

            {/* Mini score rings */}
            <div style={{ display: 'flex', gap: 6 }}>
              {METRICS.map(m => (
                <ScoreRing key={m.title} score={m.result?.score} size={28} />
              ))}
            </div>

            {visible
              ? <ChevronUp size={14} style={{ color: '#334155' }} />
              : <ChevronDown size={14} style={{ color: '#334155' }} />
            }
          </div>

          {/* Metric cards */}
          {visible && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* Info note */}
              <div style={{
                display: 'flex', gap: 6, alignItems: 'flex-start',
                padding: '6px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1a2234',
                marginBottom: 2,
              }}>
                <Info size={11} style={{ color: '#334155', flexShrink: 0, marginTop: 1 }} />
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10, color: '#334155', lineHeight: 1.5,
                }}>
                  Click any metric to see detailed breakdown. Scores are LLM-judged and approximate.
                </p>
              </div>

              {METRICS.map(m => (
                <MetricCard
                  key={m.title}
                  title={m.title}
                  description={m.description}
                  result={m.result}
                />
              ))}

              {/* Re-run button */}
              <button
                onClick={runEvaluation}
                disabled={loading}
                style={{
                  marginTop: 4,
                  padding: '6px 0', borderRadius: 6,
                  border: '1px solid #1a2234',
                  background: 'transparent',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, color: '#334155',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2A3A52'
                  e.currentTarget.style.color = '#475569'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1a2234'
                  e.currentTarget.style.color = '#334155'
                }}
              >
                ↺ re-run evaluation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}