import { Zap } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <nav className="px-6 py-4 border-b border-[#2e2e4e]">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowAgent</span>
        </Link>
      </nav>

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}