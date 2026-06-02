import Link from 'next/link'
import { ArrowRight, Zap, Bot, BarChart3, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white">

      {/* Navbar */}
      <nav className="border-b border-[#2e2e4e] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">FlowAgent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#a0a0b8] hover:text-white transition-colors text-sm"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1a1a2e] border border-[#2e2e4e] rounded-full px-4 py-1.5 text-sm text-[#a0a0b8] mb-8">
          <span className="w-2 h-2 bg-accent rounded-full"></span>
          Powered by AI Agents + n8n
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Automate customer inquiries
          <br />
          <span className="text-accent">with AI agents</span>
        </h1>
        <p className="text-[#a0a0b8] text-xl max-w-2xl mx-auto mb-10">
          Connect Gmail and WhatsApp. Let specialized AI agents classify,
          research, qualify, and respond to every customer message automatically.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start for free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-[#2e2e4e] hover:border-[#4e4e6e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Bot size={24} className="text-accent" />,
              title: '5 Specialized AI Agents',
              description: 'Classifier, Researcher, Qualifier, Responder and Executor work together on every inquiry.'
            },
            {
              icon: <Zap size={24} className="text-accent" />,
              title: 'Gmail & WhatsApp',
              description: 'Trigger workflows from real customer messages and send responses automatically.'
            },
            {
              icon: <BarChart3 size={24} className="text-accent" />,
              title: 'Live Monitoring',
              description: 'Watch every agent step in real time with detailed scorecards and analytics.'
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-[#0f0f17] rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-[#a0a0b8] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2e2e4e] px-6 py-8 mt-16">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold">FlowAgent</span>
          </div>
          <p className="text-[#a0a0b8] text-sm">
            Built with n8n + Ollama. Fully self-hosted.
          </p>
        </div>
      </footer>

    </div>
  )
}