import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ className, label, error, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[#1B4D3E]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg transition-colors outline-none',
          'bg-[#1B4D3E] text-white placeholder:text-white',
          'border focus:ring-1',
          error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-[#1a2234] hover:border-[#2A3A52] focus:border-violet-500/50 focus:ring-violet-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export { Input }