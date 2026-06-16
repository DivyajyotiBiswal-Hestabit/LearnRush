import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Bot } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
          <Bot className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Page not found
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">Start Research</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}