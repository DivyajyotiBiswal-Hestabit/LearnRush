"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

export default function Page() {
  const [open, setOpen] = useState(false);

  const orders = [
    { id: "#1024", customer: "Alice", total: "$120", status: "Paid" },
    { id: "#1025", customer: "Bob", total: "$75", status: "Pending" },
    { id: "#1026", customer: "Charlie", total: "$210", status: "Shipped" },
  ];

  const products = [
    { name: "Wireless Headphones", sales: 320 },
    { name: "Smart Watch", sales: 210 },
    { name: "Gaming Mouse", sales: 150 },
  ];

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">E-commerce Dashboard</h1>
        <Button onClick={() => setOpen(true)}>Create Order</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <h2 className="text-xs uppercase text-gray-400">Revenue</h2>
          <p className="text-3xl font-bold">$48,920</p>
          <Badge>+9%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase text-gray-400">Orders</h2>
          <p className="text-3xl font-bold">1,240</p>
          <Badge>+5%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase text-gray-400">Customers</h2>
          <p className="text-3xl font-bold">3,210</p>
          <Badge>+12%</Badge>
        </Card>

        <Card>
          <h2 className="text-xs uppercase text-gray-400">Products</h2>
          <p className="text-3xl font-bold">84</p>
          <Badge>Stable</Badge>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title="Recent Orders">
        <div className="space-y-3">
          {orders.map((order, i) => (
            <div key={i} className="flex justify-between border-b pb-2">
              <span>{order.id}</span>
              <span>{order.customer}</span>
              <span>{order.total}</span>
              <span className="text-gray-500">{order.status}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Products */}
      <Card title="Top Selling Products">
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={i} className="flex justify-between border-b pb-2">
              <span>{product.name}</span>
              <span className="text-gray-500">{product.sales} sales</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Action */}
      <Card title="Quick Action">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input placeholder="Search orders..." />
          <Button>Search</Button>
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Create New Order</h2>
        <p className="text-gray-600">Order creation form coming soon.</p>
      </Modal>

    </div>
  );
}
