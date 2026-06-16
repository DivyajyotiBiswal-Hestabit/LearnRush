'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { UsageTracker } from '@/components/profile/UsageTracker'
import { DangerZone } from '@/components/profile/DangerZone'
import { UsersPanel } from '@/components/admin/UsersPanel'

export function EnhancedProfileClient({ profile }) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name ?? '',
    bio: profile.bio ?? '',
  })
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'usage', label: 'Usage & Limits' },
    ...(profile.role === 'admin' ? [{ id: 'admin', label: 'Admin' }] : []),
    { id: 'danger', label: 'Account' },
  ]

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Update failed')
        return
      }

      toast.success('Profile saved!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'admin' && (
              <Shield className="w-3 h-3 inline ml-1 text-purple-500" />
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-5">
          {/* Avatar + Name */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <AvatarUpload
                  currentUrl={avatarUrl}
                  userName={formData.full_name || profile.email}
                  onUpload={setAvatarUrl}
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {formData.full_name || 'Your Name'}
                  </p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      profile.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profile.role === 'admin' ? '⚡ Admin' : 'Free Plan'}
                    </span>
                    {profile.last_active_at && (
                      <span className="text-xs text-gray-400">
                        Last active: {new Date(profile.last_active_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold text-gray-700">
                Personal Information
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  value={formData.full_name}
                  onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Your full name"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400">Email cannot be changed</p>
                </div>

                <Button type="submit" loading={loading} className="w-fit">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="flex flex-col gap-5">
          <UsageTracker profile={profile} />

          {/* Usage Tips */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm font-medium text-indigo-800 mb-1">
              💡 Usage Tips
            </p>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Delete unused teams to free up team slots</li>
              <li>• Remove old documents to stay within document limits</li>
              <li>• Each question you ask counts as one query</li>
            </ul>
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && profile.role === 'admin' && (
        <div className="flex flex-col gap-5">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              You have admin access. Handle with care.
            </p>
          </div>
          <UsersPanel />
        </div>
      )}

      {/* Account / Danger Tab */}
      {activeTab === 'danger' && (
        <div className="flex flex-col gap-5">
          {/* Account Info */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Account Information
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account ID</span>
                  <span className="text-gray-700 font-mono text-xs">
                    {profile.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member since</span>
                  <span className="text-gray-700">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="text-gray-700 capitalize">{profile.role ?? 'user'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DangerZone userEmail={profile.email} />
        </div>
      )}
    </div>
  )
}