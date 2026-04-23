import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="h-48 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-300 relative">
        <div className="absolute bottom-[-40px] left-8">
          <Card className="p-4 flex items-center gap-4 shadow-lg">


            <div>
              <h2 className="font-semibold text-lg">DIVYAJYOTI</h2>
              
            </div>

            <Button className="ml-6">Edit</Button>

          </Card>
        </div>
      </div>

      {/* Spacer below floating card */}
      <div className="h-10" />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Platform Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Platform Settings</h3>

          <div className="space-y-3 text-sm">

            <label className="flex justify-between">
              Email notifications
              <input type="checkbox" defaultChecked />
            </label>

            <label className="flex justify-between">
              Product updates
              <input type="checkbox" />
            </label>

            <label className="flex justify-between">
              Marketing emails
              <input type="checkbox" defaultChecked />
            </label>

          </div>
        </Card>

        {/* Profile Info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Profile Information</h3>

          

          <div className="text-sm space-y-2">
            <p><strong>Name:</strong> Divyajyoti</p>
            <p><strong>Email:</strong> divyajyoti@storeflow.com</p>
            <p><strong>Location:</strong> India</p>
          </div>
        </Card>

        {/* Conversations */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Recent Activity</h3>

          <div className="space-y-3 text-sm text-gray-600">
            <p>✔ Order #1243 updated</p>
            <p>✔ New customer registered</p>
            <p>✔ Payment received</p>
          </div>
        </Card>

      </div>
    </div>
  );
}