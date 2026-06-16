'use client'

import { useState } from 'react'
import { Plus, Trash2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ROUTING_CONDITIONS, ROUTING_ACTIONS } from '@/config/agentConfig'
import { AVAILABLE_MODELS } from '@/config/models'

function RuleRow({ rule, index, onChange, onRemove }) {
  function updateCondition(condIndex, field, value) {
    const newConditions = [...(rule.conditions ?? [])]
    newConditions[condIndex] = { ...newConditions[condIndex], [field]: value }
    onChange(index, { ...rule, conditions: newConditions })
  }

  function addCondition() {
    const newConditions = [...(rule.conditions ?? []), { type: 'contains_keyword', value: '' }]
    onChange(index, { ...rule, conditions: newConditions })
  }

  function removeCondition(condIndex) {
    const newConditions = rule.conditions.filter((_, i) => i !== condIndex)
    onChange(index, { ...rule, conditions: newConditions })
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-white">
      {/* Rule name + priority */}
      <div className="flex items-center gap-3">
        <Badge variant="primary">Rule {index + 1}</Badge>
        <input
          value={rule.name ?? ''}
          onChange={e => onChange(index, { ...rule, name: e.target.value })}
          placeholder="Rule name..."
          className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Priority</span>
          <input
            type="number"
            min={1}
            max={10}
            value={rule.priority ?? 1}
            onChange={e => onChange(index, { ...rule, priority: parseInt(e.target.value) })}
            className="w-14 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none text-center"
          />
        </div>
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Conditions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            IF (all conditions match)
          </span>
          <button
            onClick={addCondition}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add condition
          </button>
        </div>

        {(rule.conditions ?? []).map((cond, condIndex) => {
          const condDef = ROUTING_CONDITIONS.find(c => c.id === cond.type)
          return (
            <div key={condIndex} className="flex items-center gap-2">
              <select
                value={cond.type}
                onChange={e => updateCondition(condIndex, 'type', e.target.value)}
                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white flex-1"
              >
                {ROUTING_CONDITIONS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              {condDef?.type === 'number' && (
                <input
                  type="number"
                  value={cond.value ?? ''}
                  onChange={e => updateCondition(condIndex, 'value', e.target.value)}
                  placeholder="value"
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg w-20"
                />
              )}

              {condDef?.type === 'text' && (
                <input
                  type="text"
                  value={cond.value ?? ''}
                  onChange={e => updateCondition(condIndex, 'value', e.target.value)}
                  placeholder="keyword..."
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg flex-1"
                />
              )}

              {condDef?.type === 'select' && (
                <select
                  value={cond.value ?? ''}
                  onChange={e => updateCondition(condIndex, 'value', e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg flex-1 bg-white"
                >
                  <option value="">Select...</option>
                  {condDef.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => removeCondition(condIndex)}
                className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        {(!rule.conditions || rule.conditions.length === 0) && (
          <p className="text-xs text-gray-400 italic">No conditions — click "Add condition"</p>
        )}
      </div>

      {/* Action */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          THEN use model
        </span>
        <select
          value={rule.action?.model_id ?? ''}
          onChange={e => onChange(index, {
            ...rule,
            action: { ...rule.action, model_id: e.target.value }
          })}
          className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Select model...</option>
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function RoutingRulesBuilder({ rules, onChange }) {
  function addRule() {
    onChange([
      ...(rules ?? []),
      {
        name: `Rule ${(rules?.length ?? 0) + 1}`,
        priority: 1,
        conditions: [{ type: 'contains_keyword', value: '' }],
        action: { model_id: '' },
      }
    ])
  }

  function updateRule(index, updatedRule) {
    const newRules = [...(rules ?? [])]
    newRules[index] = updatedRule
    onChange(newRules)
  }

  function removeRule(index) {
    onChange((rules ?? []).filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          Dynamic Model Routing Rules
        </span>
        <span className="text-xs text-gray-400 ml-1">
          ({rules?.length ?? 0} rules)
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          className="ml-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Rule
        </Button>
      </div>

      {(!rules || rules.length === 0) && (
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
          <p className="text-sm text-gray-500">No routing rules yet</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Rules automatically switch models based on query characteristics
          </p>
        </div>
      )}

      {(rules ?? []).map((rule, i) => (
        <RuleRow
          key={i}
          rule={rule}
          index={i}
          onChange={updateRule}
          onRemove={removeRule}
        />
      ))}
    </div>
  )
}