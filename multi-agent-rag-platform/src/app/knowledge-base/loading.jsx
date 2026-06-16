import { CardSkeleton } from '@/components/ui/Skeleton'

export default function KBLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-9 w-40 bg-gray-100 animate-pulse rounded-lg" />
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}