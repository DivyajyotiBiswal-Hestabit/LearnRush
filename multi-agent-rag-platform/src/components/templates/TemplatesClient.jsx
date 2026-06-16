'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Search } from 'lucide-react'
import { toast } from 'sonner'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal'
import { TEAM_TEMPLATES, TEMPLATE_CATEGORIES } from '@/config/templates'

export function TemplatesClient() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const filtered = TEAM_TEMPLATES.filter(t => {
    const matchesCategory = category === 'all' || t.category === category
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    setModalOpen(true)
  }

  async function handleCreateFromTemplate(template, customName) {
    setCreating(true)
    try {
      const res = await fetch('/api/teams/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          customName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create team')
        return
      }

      toast.success(`Team "${data.team.name}" created!`)
      setModalOpen(false)

      // Redirect to the new team or to teams list
      router.push('/teams')
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Layout className="w-4 h-4 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Team Templates</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Pre-built agent teams for common research tasks — create in one click
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                category === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        {category !== 'all' && ` in ${category}`}
        {search && ` matching "${search}"`}
      </p>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-gray-500 font-medium">No templates found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleSelectTemplate}
            />
          ))}
        </div>
      )}

      {/* Custom Team CTA */}
      <div className="mt-10 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl text-center">
        <p className="text-base font-semibold text-gray-900 mb-1">
          Need something custom?
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Build your own team with any combination of agents and models
        </p>
        <button
          onClick={() => router.push('/teams/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Custom Team
        </button>
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={selectedTemplate}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTemplate(null)
        }}
        onConfirm={handleCreateFromTemplate}
        loading={creating}
      />
    </div>
  )
}