import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-white/5 text-slate-500 border-white/8',
  primary: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger:  'bg-red-500/15 text-red-400 border-red-500/30',
  purple:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  blue:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      'font-mono tracking-wide',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}