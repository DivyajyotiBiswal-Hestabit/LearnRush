import { cn } from '@/lib/utils/cn'

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1B4D3E]">{label}</label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg bg-[#ACE1AF] text-white',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}