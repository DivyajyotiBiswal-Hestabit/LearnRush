'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuthActions()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    await login(email, password)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-accent px-6 py-4 border-b border-[#2e2e4e]">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white border border-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowAgent</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-accent border border-[#2e2e4e] rounded-2xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-[#a0a0b8] text-[#a0a0b8] text-sm">Sign in to your FlowAgent account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-accent placeholder-[#4e4e6e] focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent transition-colors text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4e4e6e] hover:text-[#a0a0b8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm border border-white"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <p className="text-center text-[#a0a0b8] text-sm mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:underline font-medium">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}