export default function TemplatesLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-lg" />
      </div>
      <div className="h-4 w-72 bg-gray-100 animate-pulse rounded mb-8" />

      <div className="flex gap-3 mb-6">
        <div className="h-9 w-48 bg-gray-100 animate-pulse rounded-lg" />
        <div className="flex gap-1.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-9 w-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-72 animate-pulse" />
        ))}
      </div>
    </div>
  )
}