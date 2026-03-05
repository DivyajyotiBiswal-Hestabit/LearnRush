const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // 👈 add this

const app = express();

// 👇 enable CORS BEFORE routes
app.use(cors());

mongoose.connect("mongodb://mongo:27017/week5db")
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Server + Mongo Running 🚀");
});
app.get("/api/health", (req, res) => {
  res.json({ container: process.env.HOSTNAME });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});