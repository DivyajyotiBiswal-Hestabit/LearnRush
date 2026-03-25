const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/day5app";

app.use(cors());
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(dbState === 1 ? 200 : 500).json({
    success: dbState === 1,
    service: "backend",
    databaseConnected: dbState === 1
  });
});

app.get("/api/message", (req, res) => {
  res.json({
    success: true,
    message: "Hello from Day 5 production-style backend",
    environment: process.env.NODE_ENV || "unknown"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});