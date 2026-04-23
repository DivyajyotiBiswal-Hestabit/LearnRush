const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue("emailQueue", { connection });

async function addEmailJob(data) {
  await emailQueue.add("sendEmail", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

module.exports = { addEmailJob };