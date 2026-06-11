import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-indigo-100 text-indigo-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}