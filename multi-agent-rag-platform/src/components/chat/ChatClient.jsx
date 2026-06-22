'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ChatMessage, TypingIndicator } from '@/components/chat/ChatMessage'
import { EnhancedRightPanel } from '@/components/chat/EnhancedRightPanel'
import { QuerySuggestions } from '@/components/chat/QuerySuggestions'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils/cn'

export function ChatClient({ teams, knowledgeBases }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? '')
  const [selectedKBId, setSelectedKBId] = useState(knowledgeBases[0]?.id ?? '')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [traces, setTraces] = useState([])
  const [chunks, setChunks] = useState([])
  const [currentScores, setCurrentScores] = useState(null)
  const [processingTime, setProcessingTime] = useState(null)
  const [chunksRetrieved, setChunksRetrieved] = useState(0)
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')
  const [lastAnswer, setLastAnswer] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const [retrievalMethod, setRetrievalMethod] = useState(null)
  const [retrievalRewrites, setRetrievalRewrites] = useState([])
  const [retrievalEmpty, setRetrievalEmpty] = useState(false)
  const [citations, setCitations] = useState([])
  const [activeCitationIndex, setActiveCitationIndex] = useState(null)


  const selectedTeam = teams.find(t => t.id === selectedTeamId)
  const selectedKB = knowledgeBases.find(kb => kb.id === selectedKBId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, traces])

  function handleNewSession() {
    setSessionId(null)
    setMessages([])
    setTraces([])
    setChunks([])
    setCurrentScores(null)
    setProcessingTime(null)
    setChunksRetrieved(0)
    setError('')
    setLastQuestion('')
    setLastAnswer('')
    setCitations([])
    setActiveCitationIndex(null)
  }

  async function handleSubmit() {
    if (!input.trim() || isProcessing) return
    if (!selectedTeamId) { setError('Please select a team first'); return }

    const question = input.trim()
    setInput('')
    setError('')
    setIsProcessing(true)
    setTraces([])
    setChunks([])
    setCurrentScores(null)
    setLastQuestion(question)

    setMessages(prev => [...prev, { role: 'user', content: question }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          teamId: selectedTeamId,
          knowledgeBaseId: selectedKBId || null,
          sessionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'session') {
              setSessionId(event.sessionId)
            }

            if (event.type === 'trace') {
              setTraces(prev => {
                const exists = prev.findIndex(
                  t => t.agentName === event.agentName &&
                       t.stepIndex === event.stepIndex &&
                       t.round === event.round
                )
                if (exists >= 0) {
                  const updated = [...prev]
                  updated[exists] = event
                  return updated
                }
                return [...prev, event]
              })
            }

            if (event.type === 'answer') {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: event.answer,
              }])
              setCurrentScores(event.scores)
              setProcessingTime(event.processingTime)
              setChunksRetrieved(event.chunksRetrieved)
              setLastAnswer(event.answer)
              setRetrievalMethod(event.retrievalMethod)          
              setRetrievalRewrites(event.retrievalRewrites ?? []) 
              setRetrievalEmpty(event.retrievalEmpty ?? false) 
              setCitations(event.citations ?? []) 

              // Fetch chunks used
              if (selectedKBId) {
                try {
                  const chunksRes = await fetch('/api/chat/sources', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      question,
                      knowledgeBaseId: selectedKBId,
                    }),
                  })
                  const chunksData = await chunksRes.json()
                  setChunks(chunksData.chunks ?? [])
                } catch {
                  // Non-fatal
                }
              }
            }

            if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              console.error('Parse error:', parseErr)
            }
          }
        }
      }
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}`,
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSuggestion(suggestion) {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  if (teams.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={MessageSquare}
          title="No agent teams yet"
          description="Create a multi-agent team before starting a research session."
          action={
            <Button onClick={() => window.location.href = '/teams/new'}>
              Create a Team
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 ">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-[#E9FFDB] border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Select
              value={selectedTeamId}
              onChange={e => {
                setSelectedTeamId(e.target.value)
                handleNewSession()
              }}
              className="w-48"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>

            {knowledgeBases.length > 0 && (
              <Select
                value={selectedKBId}
                onChange={e => setSelectedKBId(e.target.value)}
                className="w-48"
              >
                <option value="">No knowledge base</option>
                {knowledgeBases.map(kb => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </Select>
            )}

            {/* ── ADD THIS BADGE RIGHT HERE ── */}
            {selectedTeam && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, flexShrink: 0,
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                ...(selectedTeam.collaboration_mode === 'parallel' ? {
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10B981',
                } : selectedTeam.collaboration_mode === 'debate' ? {
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#F59E0B',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #1a2234',
                  color: '#475569',
                })
      }        }>
                {selectedTeam.collaboration_mode === 'parallel' && '⚡ '}
                {selectedTeam.collaboration_mode === 'debate' && '⚠ '}
                {selectedTeam.collaboration_mode}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            disabled={isProcessing}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Session
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-[#E9FFDB]">
          {messages.length === 0 && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Start a research session
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                {selectedTeam
                  ? `${selectedTeam.agents?.length ?? 0} agents ready — ${selectedTeam.collaboration_mode} mode`
                  : 'Select a team to begin'
                }
              </p>

              {selectedTeam && (
                <QuerySuggestions
                  domain={selectedTeam.research_domain}
                  onSelect={handleSuggestion}
                  className="max-w-md"
                />
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessage
                message={msg}
                citations={msg.role === 'assistant' && i === messages.length - 1
                  ? citations
                  : []
                }
                onCitationClick={(idx) => {
                  setActiveCitationIndex(idx)
                }}   
              />

              {/* Show retrieval fallback notice after assistant messages */}
              {msg.role === 'assistant' && i === messages.length - 1 && retrievalMethod && retrievalMethod !== 'hybrid' && (
                <div style={{
                  marginTop: 6, marginLeft: 44,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: retrievalEmpty
                    ? 'rgba(239,68,68,0.08)'
                    : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${retrievalEmpty
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(245,158,11,0.2)'}`,
                  maxWidth: '80%',
                }}>
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: retrievalEmpty ? '#ef4444' : '#F59E0B',
                    marginBottom: retrievalRewrites?.length > 0 ? 4 : 0,
                  }}>
                    {retrievalEmpty
                      ? '⚠ No relevant documents found after all fallback attempts'
                      : `ℹ Retrieved via ${retrievalMethod.replace(/_/g, ' ')}`
                    }
                  </p>
                  {retrievalRewrites?.length > 0 && !retrievalEmpty && (
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: '#64748b',
                    }}>
                      Query rewritten as: "{retrievalRewrites[0]}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {isProcessing && messages[messages.length - 1]?.role === 'user' && (
            <TypingIndicator />
          )}

          {/* Follow-up suggestions after answer */}
          {!isProcessing && lastAnswer && messages.length > 0 && (
            <div className="flex justify-start pl-11">
              <QuerySuggestions
                domain={selectedTeam?.research_domain}
                onSelect={handleSuggestion}
                lastAnswer={lastAnswer}
                className="max-w-lg"
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 bg-[#E9FFDB] border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your research question... (Enter to send, Shift+Enter for new line)"
                rows={2}
                disabled={isProcessing}
                className={cn(
                  'w-full px-4 py-3 text-sm border rounded-xl resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  'disabled:bg-gray-50 disabled:text-gray-400',
                  'border-gray-300'
                )}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing || !selectedTeamId}
              loading={isProcessing}
              size="lg"
              className="flex-shrink-0 h-[52px]"
            >
              <Send className="w-5 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Right Panel */}
      <EnhancedRightPanel
        team={selectedTeam}
        traces={traces}
        chunks={chunks}
        citations={citations}
        scores={currentScores}
        processingTime={processingTime}
        chunksRetrieved={chunksRetrieved}
        isProcessing={isProcessing}
        lastQuestion={lastQuestion}
      />
    </div>
  )
}