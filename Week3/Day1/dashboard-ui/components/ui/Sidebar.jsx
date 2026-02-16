export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md border-r hidden md:flex flex-col">

      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b">
        <span className="text-lg font-bold">MyApp</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">

        <a className="block px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          Dashboard
        </a>

        <a className="block px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          Analytics
        </a>

        <a className="block px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          Users
        </a>

        <a className="block px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          Settings
        </a>

      </nav>

    </aside>
  );
}
