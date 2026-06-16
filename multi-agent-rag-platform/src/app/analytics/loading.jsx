import { StatCardSkeleton } from '@/components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-36 bg-gray-100 animate-pulse rounded-lg mb-2" />
      <div className="h-4 w-64 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 h-72 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-72 animate-pulse" />
      </div>
    </div>
  )
}