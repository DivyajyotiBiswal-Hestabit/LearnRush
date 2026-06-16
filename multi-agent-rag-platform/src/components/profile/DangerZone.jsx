'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function DangerZone({ userEmail }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const isConfirmed = confirmText === userEmail

  async function handleDeleteAccount() {
    if (!isConfirmed) return
    setLoading(true)

    try {
      const res = await fetch('/api/profile/account', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to delete account')
        return
      }

      // Sign out and redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/register'
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setConfirmText('') }}
        title="Delete Account"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              This will permanently delete:
            </p>
            <ul className="text-sm text-red-600 mt-1 list-disc list-inside space-y-0.5">
              <li>Your account and profile</li>
              <li>All agent teams and configurations</li>
              <li>All uploaded documents and knowledge bases</li>
              <li>All research history and traces</li>
            </ul>
          </div>

          <Input
            label={`Type your email to confirm: ${userEmail}`}
            placeholder={userEmail}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={!isConfirmed}
              loading={loading}
              className="flex-1"
            >
              Permanently Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => { setModalOpen(false); setConfirmText('') }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}