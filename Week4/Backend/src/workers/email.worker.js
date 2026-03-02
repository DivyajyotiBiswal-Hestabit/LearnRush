const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const fs = require("fs");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("Processing email:", job.data);

    fs.appendFileSync(
      "./logs/email.log",
      `Email sent to ${job.data.email}\n`
    );
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("Job failed:", err.message);
});