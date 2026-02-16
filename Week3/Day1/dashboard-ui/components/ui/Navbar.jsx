export default function Navbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6 border-b">

      <h1 className="text-xl font-semibold text-gray-800">
        Dashboard
      </h1>

      <div className="flex items-center gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Profile */}
        <div className="w-9 h-9 rounded-full bg-gray-300"></div>

      </div>

    </header>
  );
}
