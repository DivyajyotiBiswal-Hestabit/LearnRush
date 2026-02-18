import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">

      <h1 className="text-2xl font-bold">Store Settings</h1>

      {/* Account */}
      <Card title="Account Settings">
        <div className="space-y-4">
          <Input placeholder="Full Name" />
          <Input placeholder="Email Address" />
          <Input placeholder="Phone Number" />

          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Store Info */}
      <Card title="Store Information">
        <div className="space-y-4">
          <Input placeholder="Store Name" />
          <Input placeholder="Support Email" />
          <Input placeholder="Business Address" />

          <Button>Update Store</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications">
        <div className="space-y-3 text-sm">

          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Email notifications for new orders
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Low stock alerts
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Weekly performance report
          </label>

        </div>
      </Card>

      {/* Security */}
      <Card title="Security">
        <div className="space-y-4">
          <Button>Change Password</Button>
          <Button>Enable Two-Factor Authentication</Button>
        </div>
      </Card>

      {/* Payments */}
      <Card title="Payment Preferences">
        <div className="space-y-4">
          <Input placeholder="Default Currency (INR, USD...)" />
          <Input placeholder="Tax Percentage" />

          <Button>Save Payment Settings</Button>
        </div>
      </Card>

    </div>
  );
}

