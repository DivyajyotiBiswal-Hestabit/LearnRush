const connectDB = require("../Backend/src/loaders/db");

const AccountRepository = require("../Backend/src/repositories/account.repository");
const OrderRepository = require("../Backend/src/repositories/order.repository");

async function run() {
  await connectDB();

  const account = await AccountRepository.create({
    firstName: "Divya",
    lastName: "Biswal",
    email: "divya@example.com",
    password: "secret123"
  });

  console.log("Account created:", account.fullName);

  const order = await OrderRepository.create({
    accountId: account._id,
    amount: 1500,
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  console.log("Order created:", order);
}

run();