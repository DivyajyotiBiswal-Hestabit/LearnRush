'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {error?.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}