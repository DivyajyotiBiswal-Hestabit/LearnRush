import { CardSkeleton } from '@/components/ui/Skeleton'

export default function TeamsLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-40 bg-gray-100 animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-100 animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}