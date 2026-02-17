"use client";

export default function Navbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/70 backdrop-blur border-b border-gray-200 shadow-sm">

      {/* Title */}
      <h1 className="text-lg font-semibold text-gray-800">
        Dashboard
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
          D
        </div>

      </div>

    </header>
  );
}



