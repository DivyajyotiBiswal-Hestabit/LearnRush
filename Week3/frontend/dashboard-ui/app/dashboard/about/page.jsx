import Card from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12 ">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">About StoreFlow</h1>
        <p className="text-black-800 leading-relaxed">
          StoreFlow is an e-commerce admin dashboard built to help store
          owners monitor sales, manage customers, analyze performance, and make
          smarter business decisions. It provides a centralized view of your
          store’s operations so you can focus on growth instead of complexity.
        </p>
      </div>

      {/* Mission */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          Our mission is to empower online businesses with clear insights and
          intuitive tools that simplify store management, improve customer
          experience, and drive sustainable revenue growth.
        </p>
      </Card>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What You Can Do</h2>

        <div className="grid md:grid-cols-2 gap-6">

          <Card className="p-5">
            <p className="font-medium">Track real-time sales</p>
            <p className="text-gray-600 text-sm">
              Monitor revenue and performance instantly.
            </p>
          </Card>

          <Card className="p-5">
            <p className="font-medium">Customer insights</p>
            <p className="text-gray-600 text-sm">
              Understand behavior and engagement patterns.
            </p>
          </Card>

          <Card className="p-5">
            <p className="font-medium">Order monitoring</p>
            <p className="text-gray-600 text-sm">
              Keep track of order activity and store health.
            </p>
          </Card>

          <Card className="p-5">
            <p className="font-medium">Analytics dashboards</p>
            <p className="text-gray-600 text-sm">
              Gain actionable insights for growth.
            </p>
          </Card>

        </div>
      </div>

      {/* Audience */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Who Is It For</h2>
        <p className="text-gray-600 leading-relaxed">
          StoreFlow is designed for e-commerce founders, operations teams,
          and product managers who need a reliable overview of store performance
          without navigating complex tools.
        </p>
      </Card>

      {/* Tech */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Built With</h2>
        <p className="text-gray-600">
          Built using Next.js, Tailwind CSS, and modern frontend architecture to
          deliver a fast, scalable, and responsive dashboard experience.
        </p>
      </Card>

    </div>
  );
}