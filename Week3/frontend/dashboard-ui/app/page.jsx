import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          StoreFlow Dashboard
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl">
          Manage orders, track revenue, monitor customers, and analyze store
          performance — all in one powerful and modern dashboard built for
          growing e-commerce businesses.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex gap-4 flex-wrap justify-center">

          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
          >
            Enter Dashboard →
          </Link>

          <Link
            href="/dashboard/about"
            className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
          >
            Learn More
          </Link>

        </div>

      </div>

      {/* Features */}
      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <div className="grid gap-6 md:grid-cols-3">

          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-lg">📦 Order Management</h3>
            <p className="text-sm text-gray-500 mt-2">
              Track orders, monitor fulfillment, and manage returns efficiently.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-lg">📊 Real-time Analytics</h3>
            <p className="text-sm text-gray-500 mt-2">
              Visualize revenue, conversion rates, and customer insights.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-lg">👥 Customer Insights</h3>
            <p className="text-sm text-gray-500 mt-2">
              Understand customer behavior and improve retention strategies.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-6 text-sm text-gray-400">
        © 2026 StoreFlow — Built with Next.js
      </footer>

    </div>
  );
}



