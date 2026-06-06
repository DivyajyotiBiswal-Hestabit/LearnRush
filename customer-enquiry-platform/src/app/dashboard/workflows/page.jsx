'use client'

import { useState } from 'react'
import { useWorkflows } from '@/hooks/useWorkflows'
import Link from 'next/link'
import {
  Plus, GitBranch, Play, Trash2,
  CheckCircle, XCircle, MoreVertical,
  Mail, MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import LiveExecutionTrace from '@/components/executions/LiveExecutionTrace'

function WorkflowCard({ workflow, onDelete, onTrigger }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [triggering, setTriggering] = useState(false)
  const [executionId, setExecutionId] = useState(null)
  const [executionComplete, setExecutionComplete] = useState(false)

  const handleTrigger = async () => {
    if (!testMessage) {
      toast.error('Please enter a test message')
      return
    }
    setTriggering(true)
    try {
      const result = await onTrigger(workflow.id, {
        message: testMessage,
        sender_name: 'Test User',
        sender_email: 'test@example.com',
        channel: workflow.trigger_channel
      })
      setExecutionId(result.execution_id)
    } catch (error) {
      toast.error('Failed to start: ' + error.message)
      setTriggering(false)
    }
  }

  const handleComplete = (execution) => {
    setExecutionComplete(true)
    setTriggering(false)
    if (execution.status === 'completed') {
      toast.success('Workflow completed!')
    } else {
      toast.error('Workflow failed')
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setTestMessage('')
    setTriggering(false)
    setExecutionId(null)
    setExecutionComplete(false)
  }

  const channelIcon = workflow.trigger_channel === 'gmail'
    ? <Mail size={13} className="text-red-400" />
    : <MessageCircle size={13} className="text-green-400" />

  return (
    <>
      <div className="bg-[#F0FFF0] border border-[#2e2e4e] rounded-xl p-5 hover:border-[#4e4e6e] transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-15 bg-accent/10 rounded-xl flex items-center justify-center">
              <GitBranch size={19} className="text-accent" />
            </div>
            <div>
              <h3 className="text-accent font-semibold text-m">{workflow.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {channelIcon}
                <span className="text-black text-xs capitalize">
                  {workflow.trigger_channel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              workflow.status === 'active'
                ? 'bg-success/10 text-success'
                : 'bg-[#2e2e4e] text-[#a0a0b8]'
            }`}>
              {workflow.status === 'active'
                ? <CheckCircle size={10} />
                : <XCircle size={10} />
              }
              {workflow.status}
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-accent hover:text-surface rounded transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-[#2e2e4e] rounded-lg shadow-xl z-10">
                  <Link
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-s text-accent hover:text-white hover:bg-[#16213e] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete(workflow.id)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-s text-error hover:bg-[#16213e] transition-colors w-full text-left"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {workflow.business_context && (
          <p className="text-accent text-xs mb-4 line-clamp-2">
            {workflow.business_context}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-1">
            {['C', 'R', 'Q', 'Re', 'E'].map((letter, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-accent/20 border border-background flex items-center justify-center text-accent text-xs font-bold"
              >
                {letter}
              </div>
            ))}
          </div>
          <span className="text-accent text-xs">5 agents configured</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#2e2e4e]">
          <span className="text-[#4e4e6e] text-xs">
            {formatDate(workflow.created_at)}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Play size={11} />
            Test Run
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface border border-[#2e2e4e] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-lg">Test Workflow</h3>
                <p className="text-[#a0a0b8] text-xs mt-0.5">{workflow.name}</p>
              </div>
              {!triggering && (
                <button
                  onClick={resetModal}
                  className="text-[#a0a0b8] hover:text-white transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Input phase */}
            {!executionId && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">
                    Test Message
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    placeholder="e.g. Hi, I ordered a blue shirt last week and it has not arrived yet. Can you help?"
                    rows={4}
                    className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-3 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={resetModal}
                    className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] py-2.5 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTrigger}
                    disabled={triggering}
                    className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Play size={14} />
                    Run Now
                  </button>
                </div>
              </>
            )}

            {/* Live trace phase */}
            {executionId && (
              <>
                <LiveExecutionTrace
                  executionId={executionId}
                  onComplete={handleComplete}
                />
                {executionComplete && (
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={resetModal}
                      className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] py-2.5 rounded-lg text-sm font-medium"
                    >
                      Close
                    </button>
                    <Link
                      href={`/dashboard/executions/${executionId}`}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-lg text-sm font-medium text-center"
                      onClick={resetModal}
                    >
                      View Full Trace
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function WorkflowsPage() {
  const { workflows, loading, deleteWorkflow, triggerWorkflow } = useWorkflows()

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return
    try {
      await deleteWorkflow(id)
      toast.success('Workflow deleted')
    } catch (error) {
      toast.error('Failed to delete workflow')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-accent text-m mt-1">
            Manage your multi-agent automation workflows
          </p>
        </div>
        <Link
          href="/dashboard/workflows/create"
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Workflow
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-[#2e2e4e] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2e2e4e] rounded-xl" />
                <div>
                  <div className="w-32 h-4 bg-[#2e2e4e] rounded mb-2" />
                  <div className="w-20 h-3 bg-[#2e2e4e] rounded" />
                </div>
              </div>
              <div className="w-full h-16 bg-[#2e2e4e] rounded mb-4" />
              <div className="w-full h-8 bg-[#2e2e4e] rounded" />
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#1a1a2e] border border-[#2e2e4e] rounded-2xl flex items-center justify-center mb-4">
            <GitBranch size={28} className="text-[#4e4e6e]" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No workflows yet</h2>
          <p className="text-[#a0a0b8] text-sm max-w-sm mb-6">
            Create your first multi-agent workflow to start automating customer inquiries
          </p>
          <Link
            href="/dashboard/workflows/create"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create your first workflow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onDelete={handleDelete}
              onTrigger={triggerWorkflow}
            />
          ))}
        </div>
      )}
    </div>
  )
}