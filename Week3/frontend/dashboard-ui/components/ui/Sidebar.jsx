"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "About", href: "/dashboard/about" }, 
  { name: "Analytics", href: "/dashboard/analytics" },
  { name: "Customers", href: "/dashboard/customers" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-900 text-gray-300 flex flex-col border-r border-slate-800">

      {/* Logo */}
      <div className="px-6 py-5 text-xl font-bold text-white">
        StoreFlow
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-3">

        {links.map((link) => {
          const active = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-indigo-600 text-white shadow"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}

      </nav>

      {/* Footer */}
      <div className="mt-auto px-6 py-4 text-xs text-slate-500">
        © 2026 MyApp
      </div>

    </aside>
  );
}

