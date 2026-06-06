'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWorkflows } from '@/hooks/useWorkflows'
import { GitBranch } from 'lucide-react'
import {
  ArrowLeft, Play, Trash2, GitBranch,
  Mail, MessageCircle, Clock, CheckCircle,
  XCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDate, formatDuration } from '@/lib/utils'

export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { deleteWorkflow, triggerWorkflow } = useWorkflows()
  const [workflow, setWorkflow] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [showTriggerModal, setShowTriggerModal] = useState(false)
  const [expandedExecution, setExpandedExecution] = useState(null)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  useEffect(() => {
    fetchWorkflow()
    fetchExecutions()
  }, [params.id])

  const fetchWorkflow = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/workflows/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setWorkflow(data.workflow)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/executions?workflow_id=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setExecutions(data.executions || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleTrigger = async () => {
    if (!testMessage) {
      toast.error('Please enter a test message')
      return
    }
    setTriggering(true)
    try {
      await triggerWorkflow(params.id, {
        message: testMessage,
        sender_name: 'Test User',
        sender_email: 'test@example.com',
        channel: workflow.trigger_channel
      })
      toast.success('Workflow executed!')
      setShowTriggerModal(false)
      setTestMessage('')
      fetchExecutions()
    } catch (error) {
      toast.error('Failed: ' + error.message)
    } finally {
      setTriggering(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this workflow?')) return
    try {
      await deleteWorkflow(params.id)
      toast.success('Workflow deleted')
      router.push('/dashboard/workflows')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-64" />
          <div className="h-48 bg-surface rounded-xl" />
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-[#a0a0b8]">Workflow not found</p>
        <Link href="/dashboard/workflows" className="text-accent text-sm mt-2 block">
          Back to workflows
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/workflows"
            className="p-2 text-[#a0a0b8] hover:text-white hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
            <p className="text-white text-sm mt-0.5">
              Created {formatDate(workflow.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTriggerModal(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={14} />
            Test Run
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 border border-error/30 text-error hover:bg-error/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-4">
          <p className="text-[#a0a0b8] text-xs mb-1">Status</p>
          <div className={`flex items-center gap-1.5 ${
            workflow.status === 'active' ? 'text-success' : 'text-[#a0a0b8]'
          }`}>
            {workflow.status === 'active'
              ? <CheckCircle size={14} />
              : <XCircle size={14} />
            }
            <span className="font-medium text-sm capitalize">{workflow.status}</span>
          </div>
        </div>
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-4">
          <p className="text-[#a0a0b8] text-xs mb-1">Channel</p>
          <div className="flex items-center gap-1.5">
            {workflow.trigger_channel === 'gmail'
              ? <Mail size={14} className="text-red-400" />
              : <MessageCircle size={14} className="text-green-400" />
            }
            <span className="text-white font-medium text-sm capitalize">
              {workflow.trigger_channel}
            </span>
          </div>
        </div>
        <div className="bg-surface border border-[#2e2e4e] rounded-xl p-4">
          <p className="text-[#a0a0b8] text-xs mb-1">Total Executions</p>
          <p className="text-white font-medium text-sm">{executions.length}</p>
        </div>
      </div>

      {/* Business context */}
      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold text-sm mb-2">Business Context</h2>
        <p className="text-[#a0a0b8] text-sm">{workflow.business_context}</p>
      </div>

      {/* Agent pipeline */}
      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold text-sm mb-4">Agent Pipeline</h2>
        <div className="space-y-2">
          {workflow.agents?.sort((a, b) => a.order_index - b.order_index).map((agent, i) => (
            <div key={agent.id} className="bg-[#0f0f17] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-accent text-xs font-bold">
                  {i + 1}
                </div>
                <span className="text-white text-sm font-medium capitalize">
                  {agent.role} Agent
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branching rules */}
      {workflow.branching_rules?.length > 0 && (
         <div className="bg-surface border border-[#2e2e4e] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={15} className="text-accent" />
            <h2 className="text-white font-semibold text-sm">Branching Rules</h2>
          </div>
          <div className="space-y-2">
            {workflow.branching_rules.map((rule, i) => (
              <div key={i} className="bg-[#0f0f17] rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded">IF</span>
                <span className="text-white text-xs capitalize">{rule.condition?.replace(/_/g, ' ')}</span>
                <span className="text-blue-400 text-xs font-bold bg-blue-400/10 px-2 py-0.5 rounded">THEN</span>
                <span className="text-white text-xs capitalize">{rule.action?.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution history */}
      <div className="bg-surface border border-[#2e2e4e] rounded-xl">
        <div className="px-5 py-4 border-b border-[#2e2e4e]">
          <h2 className="text-white font-semibold text-sm">Execution History</h2>
        </div>

        {executions.length === 0 ? (
          <div className="py-10 text-center">
            <Clock size={24} className="text-[#4e4e6e] mx-auto mb-2" />
            <p className="text-[#a0a0b8] text-sm">No executions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2e2e4e]">
            {executions.map(execution => (
              <div key={execution.id} className="p-4">
                <button
                  onClick={() => setExpandedExecution(
                    expandedExecution === execution.id ? null : execution.id
                  )}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      execution.status === 'completed' ? 'bg-success' :
                      execution.status === 'failed' ? 'bg-error' : 'bg-warning'
                    }`} />
                    <div className="text-left">
                      <p className="text-white text-sm truncate max-w-xs">
                        {execution.original_message}
                      </p>
                      <p className="text-[#4e4e6e] text-xs">
                        {formatDate(execution.started_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      execution.status === 'completed'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}>
                      {execution.status}
                    </span>
                    {expandedExecution === execution.id
                      ? <ChevronUp size={14} className="text-[#a0a0b8]" />
                      : <ChevronDown size={14} className="text-[#a0a0b8]" />
                    }
                  </div>
                </button>

                {expandedExecution === execution.id && (
                  <div className="mt-3 bg-[#0f0f17] rounded-lg p-4">
                    <p className="text-[#a0a0b8] text-xs font-medium mb-2">Final Reply</p>
                    <p className="text-white text-sm whitespace-pre-wrap">
                      {execution.final_reply || 'No reply generated'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface border border-[#2e2e4e] rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white font-semibold text-lg mb-2">Test Workflow</h3>
            <p className="text-[#a0a0b8] text-sm mb-5">
              Send a test customer inquiry through all 5 agents
            </p>
            <textarea
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Enter a test customer message..."
              rows={4}
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-3 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTriggerModal(false); setTestMessage('') }}
                className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {triggering ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : <Play size={14} />}
                {triggering ? 'Running...' : 'Run Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}