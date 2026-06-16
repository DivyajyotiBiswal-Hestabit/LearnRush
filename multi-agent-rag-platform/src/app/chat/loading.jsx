export default function ChatLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col flex-1">
        <div className="h-14 bg-white border-b border-gray-200 animate-pulse" />
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-24 bg-white border-t border-gray-200 animate-pulse" />
      </div>
      <div className="hidden lg:block w-80 border-l border-gray-200 bg-white animate-pulse" />
    </div>
  )
}