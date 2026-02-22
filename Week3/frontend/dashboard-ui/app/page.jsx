import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LandingNavbar from "@/components/ui/LandingPageNavbar";

export const metadata = {
  title: "StoreFlow — E-commerce Dashboard",
  description:
    "StoreFlow helps you manage orders, customers, analytics, and revenue with a modern e-commerce dashboard.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
        {/* Navbar */}
        <LandingNavbar />
        
        {/* Dark gradient background */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(100deg,#020500_0%,#020500_40%,#020600_60%,#010617_100%)]" />

        {/* Soft shade blobs */}
        <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-200px] left-[-250px] w-[600px] h-[500px] bg-indigo-600/40 blur-3xl rounded-full" />
            <div className="absolute bottom-[-200px] right-[-250px] w-[600px] h-[500px] bg-indigo-600/40 blur-3xl rounded-full" />
        </div>


      {/* HERO */}
      <AnimatedSection>
        <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-6xl mx-auto">

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Run Your Store Smarter
          </h1>

          <p className="mt-6 text-lg text-gray-400 max-w-2xl">
            StoreFlow is your all-in-one e-commerce command center — track sales,
            monitor customers, analyze growth, and make data-driven decisions with confidence.
          </p>

          <div className="mt-8 flex gap-4 flex-wrap justify-center">
            <Link
              href="/dashboard"
              className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
            >
              Enter Dashboard →
            </Link>

            <Link
              href="/dashboard/about"
              className="px-7 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
            >
              Learn More
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative flex justify-center mt-15">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>

              <Image
                  src="/e_commerce.jpg"
                  alt="Dashboard preview"
                  width={400}
                  height={200}
                  className="relative rounded-2xl shadow-2xl border border-slate-700"
              />
          </div>


        </section>
      </AnimatedSection>

      {/* FEATURES */}
      <AnimatedSection>
        <section className="px-6 py-20 bg-gray border-t">
          <div className="max-w-6xl mx-auto">

            <h2 className="text-3xl font-bold text-center text-black-100">
              Everything you need to scale
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">

              <FeatureCard
                title="Order Management"
                description="Track orders, shipping, refunds, and fulfillment in one place."
              />

              <FeatureCard
                title="Real-time Analytics"
                description="Monitor revenue, conversion rates, and growth metrics."
              />

              <FeatureCard
                title="Customer Insights"
                description="Understand behavior and improve retention strategies."
              />

            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* TESTIMONIALS */}
      <AnimatedSection>
        <section className="px-6 py-20 bg-black-10">
          <div className="max-w-5xl mx-auto text-center">

            <h2 className="text-3xl font-bold text-white-900">
              Loved by growing businesses
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2">

              <Testimonial
                quote="StoreFlow helped us increase revenue visibility overnight."
                author="Priya Sharma — Founder"
              />

              <Testimonial
                quote="The clean UI and insights changed how we run operations."
                author="Rahul Mehta — Operations Lead"
              />

            </div>

          </div>
        </section>
      </AnimatedSection>

      {/* FOOTER */}
      <footer className="bg-white border-t py-10 text-center text-sm text-gray-800">
        © 2026 StoreFlow — Built with Next.js & Tailwind
      </footer>

    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition">
      <h3 className="text-gray-800 font-semibold">{title}</h3>
      <p className="text-gray-500 mt-2">{description}</p>
    </div>
  );
}

function Testimonial({ quote, author }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <p className="text-gray-600 italic">“{quote}”</p>
      <p className="mt-4 text-sm font-medium text-slate-800">{author}</p>
    </div>
  );
}


