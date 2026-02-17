"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto">

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <h2 className="text-xs uppercase tracking-wide text-gray-400">Users</h2>
          <p className="text-3xl font-bold mt-1">1,245</p>

          <Badge>+12%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase tracking-wide text-gray-400">Revenue</h2>
          <p className="text-3xl font-bold mt-1">$34,200</p>

          <Badge>+8%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase tracking-wide text-gray-400">Orders</h2>
          <p className="text-3xl font-bold mt-1">320</p>

          <Badge>+5%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase tracking-wide text-gray-400">Performance</h2>
          <p className="text-3xl font-bold mt-1">98%</p>

          <Badge>Stable</Badge>
        </Card>
      </div>

      {/* Form Section */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Quick Action</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input placeholder="Enter something..." />
          <Button>Submit</Button>
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Example Modal</h2>
        <p>This is a reusable modal component.</p>
      </Modal>

    </div>
  );
}
