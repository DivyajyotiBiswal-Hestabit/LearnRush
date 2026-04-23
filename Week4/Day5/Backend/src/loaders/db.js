const mongoose = require("mongoose");
const config = require("../config");

const connectDB = async () => {
  try {
    console.log("Trying to connect to:", config.mongoUri); // 👈 ADD THIS

    await mongoose.connect(config.mongoUri);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("Full error:", error.message); // 👈 CHANGE THIS
    process.exit(1);
  }
};

module.exports = connectDB;