import { cn } from '@/lib/utils/cn'

export function Skeleton({ className }) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg bg-gray-100',
      className
    )} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <Skeleton className="w-9 h-9 rounded-lg mb-3" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-4 w-24 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
  )
}