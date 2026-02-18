import Card from "@/components/ui/Card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <Card title="Total Visitors">
          <p className="text-3xl font-semibold">18,540</p>
          <p className="text-sm text-green-600">↑ 12% vs last week</p>
        </Card>

        <Card title="Orders Today">
          <p className="text-3xl font-semibold">324</p>
          <p className="text-sm text-green-600">↑ 8% growth</p>
        </Card>

        <Card title="Conversion Rate">
          <p className="text-3xl font-semibold">4.2%</p>
          <p className="text-sm text-gray-500">Stable performance</p>
        </Card>

        <Card title="Revenue">
          <p className="text-3xl font-semibold">$38,920</p>
          <p className="text-sm text-green-600">↑ Strong sales</p>
        </Card>

      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card title="Returning Customers">
          <p className="text-3xl font-semibold">62%</p>
          <p className="text-sm text-gray-500">
            Indicates strong customer loyalty
          </p>
        </Card>

        <Card title="Average Order Value">
          <p className="text-3xl font-semibold">$124</p>
          <p className="text-sm text-gray-500">
            Slight increase this month
          </p>
        </Card>

      </div>

      {/* Traffic Overview */}
      <Card title="Traffic Overview">
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Organic Search — 48%</p>
          <p>• Paid Ads — 22%</p>
          <p>• Social Media — 18%</p>
          <p>• Direct — 12%</p>
        </div>
      </Card>

      {/* Performance Summary */}
      <Card title="Performance Summary">
        <p className="text-gray-500">
          Your store is performing well with steady growth in traffic and
          conversions. Focus on improving checkout speed and running targeted
          campaigns to boost repeat purchases.
        </p>
      </Card>

    </div>
  );
}

