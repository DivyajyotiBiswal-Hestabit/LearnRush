import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1">

        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}
