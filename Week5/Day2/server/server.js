const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "server",
    status: "ok"
  });
});

app.get("/api/message", async (req, res) => {
  res.json({
    success: true,
    message: "Hello from Node server running in Docker Compose",
    mongoUriUsed: mongoUri
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});