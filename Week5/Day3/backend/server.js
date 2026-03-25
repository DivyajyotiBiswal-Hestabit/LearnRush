const express = require("express");

const app = express();
const PORT = 3000;

const instanceName = process.env.INSTANCE_NAME || "unknown-instance";

app.get("/health", (req, res) => {
  res.json({
    success: true,
    instance: instanceName,
    status: "ok"
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Response from backend instance",
    instance: instanceName,
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${instanceName} running on port ${PORT}`);
});