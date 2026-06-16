import { CardSkeleton } from '@/components/ui/Skeleton'

export default function HistoryLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-lg mb-2" />
      <div className="h-4 w-40 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="flex gap-3 mb-6">
        <div className="h-9 flex-1 max-w-sm bg-gray-100 animate-pulse rounded-lg" />
        <div className="flex gap-1">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-9 w-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[1,2,3,4,5].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}