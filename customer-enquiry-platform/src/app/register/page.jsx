'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, loading } = useAuthActions()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password) return
    await register(email, password, fullName)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-accent px-6 py-4 border-b border-[#2e2e4e]">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowAgent</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-accent border border-[#2e2e4e] rounded-2xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
              <p className="text-[#a0a0b8] text-sm">Start automating customer inquiries in minutes</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text- white mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
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
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm mt-2 border border-white"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="text-center text-[#a0a0b8] text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
          <p className="text-center text-[#4e4e6e] text-m mt-4">
            By creating an account you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}