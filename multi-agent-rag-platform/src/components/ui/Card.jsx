import { cn } from '@/lib/utils/cn'

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('bg-[#ACE1AF] rounded-xl border border-[#1a2234]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-4 border-b border-[#1a2234]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('px-5 py-3 bg-[#0A0D13] rounded-b-xl border-t border-[#1a2234]', className)} {...props}>
      {children}
    </div>
  )
}