"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/70 backdrop-blur border-b border-gray-200 shadow-sm">

      {/* Title */}
      <h1 className="text-lg font-semibold text-gray-800">
        StoreFlow
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
        <Link href="/dashboard/profile">
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
                D
            </div>
        </Link>

      </div>

    </header>
  );
}



