import Card from "@/components/ui/Card";

export default function CustomersPage() {
  const customers = [
    {
      name: "Alice Johnson",
      email: "alice@email.com",
      status: "VIP",
      orders: 24,
      spend: "$2,340",
      joined: "Jan 2024",
    },
    {
      name: "Bob Smith",
      email: "bob@email.com",
      status: "Active",
      orders: 8,
      spend: "$540",
      joined: "Mar 2024",
    },
    {
      name: "Charlie Brown",
      email: "charlie@email.com",
      status: "Blocked",
      orders: 2,
      spend: "$90",
      joined: "Jun 2024",
    },
    {
      name: "Emily Washington",
      email: "emily@email.com",
      status: "Active",
      orders: 5,
      spend: "$400",
      joined: "Aug 2025",
    },
    {
      name: "Brook Potter",
      email: "brook@email.com",
      status: "Active",
      orders: 4,
      spend: "$250",
      joined: "Sep 2024",
    },
    {
      name: "Peter Waters",
      email: "peter@email.com",
      status: "Active",
      orders: 8,
      spend: "$750",
      joined: "Oct 2025",
    },
    {
      name: "Lara Smith",
      email: "lara@email.com",
      status: "Blocked",
      orders: 1,
      spend: "$50",
      joined: "July 2024",
    },
    {
      name: "Sam Potter",
      email: "sam@email.com",
      status: "Active",
      orders: 7,
      spend: "$380",
      joined: "Feb 2024",
    },
    {
      name: "David Bricks",
      email: "david@email.com",
      status: "Active",
      orders: 4,
      spend: "$280",
      joined: "Sep 2025",
    },
    {
      name: "John Peter",
      email: "john@email.com",
      status: "VIP",
      orders: 15,
      spend: "$1950",
      joined: "July 2024",
    },{
      name: "Mitchel Duck",
      email: "mitchel@email.com",
      status: "VIP",
      orders: 20,
      spend: "$2390",
      joined: "Jan 2025",
    },{
      name: "Bella Fisher",
      email: "john@email.com",
      status: "Active",
      orders: 7,
      spend: "$420",
      joined: "Nov 2024",
    },{
      name: "Olly Peter",
      email: "olly@email.com",
      status: "Active",
      orders: 10,
      spend: "$850",
      joined: "July 2024",
    },
  ];

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Customers</h1>

      <Card title="Customer List">
        <div className="space-y-4">

          {customers.map((customer, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-3"
            >
              {/* Left */}
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>

              {/* Right */}
              <div className="flex gap-6 text-sm mt-2 md:mt-0">

                <span>
                  Orders: <strong>{customer.orders}</strong>
                </span>

                <span>
                  Spend: <strong>{customer.spend}</strong>
                </span>

                <span className="px-2 py-1 rounded bg-gray-100">
                  {customer.status}
                </span>

                <span className="text-gray-500">
                  Joined {customer.joined}
                </span>

              </div>
            </div>
          ))}

        </div>
      </Card>
    </div>
  );
}

