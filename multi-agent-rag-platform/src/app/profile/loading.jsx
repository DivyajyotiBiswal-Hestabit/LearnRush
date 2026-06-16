export default function ProfileLoading() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg mb-2" />
      <div className="h-4 w-48 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
            <div className="h-3 w-48 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
              <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            </div>
          ))}
          <div className="h-9 w-28 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}