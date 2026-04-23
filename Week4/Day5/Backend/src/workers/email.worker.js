// src/workers/email.worker.js
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const fs = require("fs");
const path = require("path");

// Redis connection (use environment variables for prod)
const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

// Ensure logs folder exists
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Initialize Worker
const worker = new Worker(
  "emailQueue",
  async (job) => {
    const { email, requestId } = job.data;

    // Log job start
    const startMsg = `[${requestId}] Processing email to: ${email}\n`;
    console.log(startMsg.trim());
    fs.appendFileSync(path.join(logDir, "email.log"), startMsg);

    try {
      // Simulate sending email (replace with real email logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Log success
      const successMsg = `[${requestId}] Email successfully sent to: ${email}\n`;
      console.log(successMsg.trim());
      fs.appendFileSync(path.join(logDir, "email.log"), successMsg);
    } catch (err) {
      // Log failure inside the job
      const failMsg = `[${requestId}] Error sending email to ${email}: ${err.message}\n`;
      console.error(failMsg.trim());
      fs.appendFileSync(path.join(logDir, "email.log"), failMsg);

      // Rethrow to trigger retry
      throw err;
    }
  },
  { connection }
);

// Event: Job completed
worker.on("completed", (job) => {
  const { requestId } = job.data;
  const msg = `[${requestId}] Job completed: ${job.id}\n`;
  console.log(msg.trim());
  fs.appendFileSync(path.join(logDir, "email.log"), msg);
});

// Event: Job failed
worker.on("failed", (job, err) => {
  const { requestId } = job.data;
  const msg = `[${requestId}] Job failed: ${job.id}, error: ${err.message}\n`;
  console.error(msg.trim());
  fs.appendFileSync(path.join(logDir, "email.log"), msg);
});

console.log("Email worker started ✅");