import "./globals.css";
import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/Sidebar";

export const metadata = {
  title: "Dashboard",
  description: "Week 3 Tailwind Dashboard Layout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex h-screen">

          {/* Sidebar */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex flex-col flex-1">

            {/* Navbar */}
            <Navbar />

            {/* Page Content */}
            <main className="p-6 overflow-y-auto">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}

