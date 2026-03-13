const connectDB = require("../Backend/src/loaders/db");
const AccountRepository = require("../Backend/src/repositories/account.repository");
const OrderRepository = require("../Backend/src/repositories/order.repository");

async function run() {
  await connectDB();

  // Generate a unique email to avoid duplicates
  const email = `divya_${Date.now()}@example.com`;

  let account;
  try {
    account = await AccountRepository.create({
      firstName: "Divya",
      lastName: "Biswal",
      email: email,
      password: "secret123",
    });
    console.log("Account created:", account.fullName);
    console.log("Password:", account.password);
  } catch (err) {
    if (err.code === 11000) {
      console.log("Email already exists:", email);
      return; // exit if duplicate
    } else {
      console.error("Error creating account:", err);
      return;
    }
  }
  
  // For repository pattern verification
  const account1 = await AccountRepository.create({ firstName: "Dishani", lastName: "Biswal", email: "dishani@example.com", password: "secret" });
  console.log(await AccountRepository.findById(account1._id));
  await AccountRepository.update(account1._id, { firstName: "Dish" });
  await AccountRepository.delete(account1._id);

  // Create order only if account creation succeeded
  try {
    const order = await OrderRepository.create({
      accountId: account._id,
      amount: 1500,
      status: "pending",
      expiresAt: new Date(Date.now() + 20*1000), // 20 sec later
    });

    console.log("Order created:", order);
  } catch (err) {
    console.error("Error creating order:", err);
  }
}

run();