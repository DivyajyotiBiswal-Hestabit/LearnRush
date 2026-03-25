const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hello from Day 4 backend over HTTPS through NGINX",
    protocolForwarded: req.headers["x-forwarded-proto"] || "unknown",
    host: req.headers.host
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});