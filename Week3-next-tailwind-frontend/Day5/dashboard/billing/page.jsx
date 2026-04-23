import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function BillingPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-gray-500 mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="text-gray-500">You are on the Free plan</p>
          </div>
          <Button>Upgrade Plan</Button>
        </div>

        <div className="text-sm text-gray-600">
          Basic analytics, limited products, community support.
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>

        <div className="grid md:grid-cols-3 gap-6">

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Free</h3>
            <p className="text-2xl font-bold">$0</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Basic analytics</li>
              <li>✓ Limited products</li>
              <li>✓ Community support</li>
            </ul>
            <Button>Select</Button>
          </Card>

          <Card className="p-5 space-y-3 border-2 border-blue-500">
            <h3 className="font-semibold">Pro</h3>
            <p className="text-2xl font-bold">$19/mo</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Advanced analytics</li>
              <li>✓ Unlimited products</li>
              <li>✓ Priority support</li>
            </ul>
            <Button>Upgrade</Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Enterprise</h3>
            <p className="text-2xl font-bold">$49/mo</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Custom reports</li>
              <li>✓ Team access</li>
              <li>✓ Dedicated support</li>
            </ul>
            <Button>Contact Sales</Button>
          </Card>

        </div>
      </div>

      {/* Billing History */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Billing History</h2>

        <div className="text-sm text-gray-500">
          No invoices yet.
        </div>
      </Card>

    </div>
  );
}