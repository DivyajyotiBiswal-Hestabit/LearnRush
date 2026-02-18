export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10">

      {/* Intro */}
      <div>
        <h1 className="text-3xl font-bold">About StoreFlow</h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          StoreFlow is an e-commerce admin dashboard built to help store
          owners monitor sales, manage customers, analyze performance, and make
          smarter business decisions. It provides a centralized view of your
          store’s operations so you can focus on growth instead of complexity.
        </p>
      </div>

      {/* Mission */}
      <div>
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="mt-2 text-gray-600 leading-relaxed">
          Our mission is to empower online businesses with clear insights and
          intuitive tools that simplify store management, improve customer
          experience, and drive sustainable revenue growth.
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-semibold">What You Can Do</h2>
        <ul className="mt-3 space-y-2 text-gray-600 list-disc list-inside">
          <li>Track real-time sales and revenue performance</li>
          <li>Analyze customer behavior and engagement</li>
          <li>Monitor order activity and store health</li>
          <li>Manage account settings and store preferences</li>
          <li>Gain actionable insights through analytics dashboards</li>
        </ul>
      </div>

      {/* Use Case */}
      <div>
        <h2 className="text-xl font-semibold">Who Is It For</h2>
        <p className="mt-2 text-gray-600 leading-relaxed">
          StoreFlow is designed for e-commerce founders, operations teams,
          and product managers who need a reliable overview of store performance
          without navigating complex tools.
        </p>
      </div>

      {/* Tech */}
      <div>
        <h2 className="text-xl font-semibold">Built With</h2>
        <p className="mt-2 text-gray-600">
          Built using Next.js, Tailwind CSS, and modern frontend architecture to
          deliver a fast, scalable, and responsive dashboard experience.
        </p>
      </div>

    </div>
  );
}
