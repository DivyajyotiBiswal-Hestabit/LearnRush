import { cn } from '@/lib/utils/cn'

export function Button({ children, className, variant = 'primary', size = 'md', loading = false, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:  'bg-[#D2B48C] text-white hover:bg-[#1B4D3E] focus:ring-violet-500 shadow-lg shadow-violet-500/20',
    secondary:'bg-[#D2B48C] text-slate-300 hover:bg-[#1e293b] focus:ring-slate-600 border border-[#1a2234]',
    danger:   'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 focus:ring-red-500',
    ghost:    'text-slate-500 hover:bg-white/5 hover:text-slate-300 focus:ring-slate-600',
    outline:  'border border-[#1a2234] text-slate-500 hover:border-[#1B4D3E] hover:text-[#1B4D3E] focus:ring-violet-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}