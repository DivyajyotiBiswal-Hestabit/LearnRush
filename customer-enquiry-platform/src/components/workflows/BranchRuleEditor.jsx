'use client'

import { useState } from 'react'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { BRANCH_CONDITIONS, BRANCH_ACTIONS } from '@/constants/workflowConstants'

export default function BranchRuleEditor({ rules = [], onChange }) {
  const addRule = () => {
    onChange([
      ...rules,
      {
        id: Date.now(),
        condition: 'high_value_lead',
        action: 'notify_email',
        config: {}
      }
    ])
  }

  const updateRule = (id, field, value) => {
    onChange(rules.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRule = (id) => {
    onChange(rules.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-white text-sm font-medium">Branching Rules</p>
        <button
          onClick={addRule}
          className="flex items-center gap-1.5 text-accent text-xs hover:underline"
        >
          <Plus size={12} />
          Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-[#0f0f17] border border-dashed border-[#2e2e4e] rounded-xl p-6 text-center">
          <p className="text-[#4e4e6e] text-xs mb-2">No branching rules yet</p>
          <button
            onClick={addRule}
            className="text-accent text-xs hover:underline"
          >
            + Add your first rule
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#0f0f17] border border-[#2e2e4e] rounded-xl p-4"
            >
              <div className="flex items-center gap-3 flex-wrap">
                {/* IF label */}
                <span className="text-accent text-xs font-bold bg-accent/10 px-2 py-1 rounded">
                  IF
                </span>

                {/* Condition */}
                <select
                  value={rule.condition}
                  onChange={e => updateRule(rule.id, 'condition', e.target.value)}
                  className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-accent flex-1 min-w-0"
                >
                  {BRANCH_CONDITIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {/* Arrow */}
                <ArrowRight size={14} className="text-[#4e4e6e] flex-shrink-0" />

                {/* THEN label */}
                <span className="text-blue-400 text-xs font-bold bg-blue-400/10 px-2 py-1 rounded">
                  THEN
                </span>

                {/* Action */}
                <select
                  value={rule.action}
                  onChange={e => updateRule(rule.id, 'action', e.target.value)}
                  className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-accent flex-1 min-w-0"
                >
                  {BRANCH_ACTIONS.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>

                {/* Delete */}
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-error hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Description */}
              <p className="text-[#4e4e6e] text-xs mt-2">
                {BRANCH_CONDITIONS.find(c => c.value === rule.condition)?.description}
                {' → '}
                {BRANCH_ACTIONS.find(a => a.value === rule.action)?.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}