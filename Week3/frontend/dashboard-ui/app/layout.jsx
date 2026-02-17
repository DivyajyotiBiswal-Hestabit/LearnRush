import Navbar from "@/components/ui/Navbar";
import Sidebar from "@/components/ui/Sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex bg-gray-100">

        <Sidebar />

        <div className="flex flex-col flex-1">
          <Navbar />
          <main className="p-8">{children}</main>
        </div>

      </body>
    </html>
  );
}

