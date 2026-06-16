import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-64 bg-gray-100 animate-pulse rounded-lg mb-2" />
      <div className="h-4 w-48 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mb-4" />
        <div className="flex gap-3">
          <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}