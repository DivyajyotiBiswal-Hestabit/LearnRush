const express = require("express");
const emailQueue = require("../queues/email.queue");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email } = req.body;

  const logPath = path.join(__dirname, "../../logs/app.log");

  fs.appendFileSync(
    logPath,
    `[${req.requestId}] Creating user with email: ${email}\n`
  );

  await emailQueue.add("sendEmail", {
    email,
    requestId: req.requestId,
  });

  fs.appendFileSync(
    logPath,
    `[${req.requestId}] Email job added to queue\n`
  );

  res.json({
    message: "User created",
    requestId: req.requestId,
  });
});

module.exports = router;