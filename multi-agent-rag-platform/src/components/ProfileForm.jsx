'use client'
import { toast } from 'sonner'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function ProfileForm({ user }) {
  const supabase = createClient()
  const [formData, setFormData] = useState({
    fullName: user.fullName ?? '',
    bio: user.bio ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      toast.errror('Failed to update profile')
    } else {
      toast.success('Profile updated successfully')
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
            {user.fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.fullName || 'Your Name'}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Your full name"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
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
  )
}