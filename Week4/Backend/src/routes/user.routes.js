const express = require("express");
const emailQueue = require("../queues/email.queue");
const fs = require("fs");
const path = require("path");
const validate = require("../middlewares/validate");
const { createUserSchema } = require("../validations/user.schema");

const router = express.Router();
const AccountRepository = require("../repositories/account.repository"); // reuse

// Helper: ensure logs folder exists
const ensureLogsFolder = () => {
  const logPath = path.join(__dirname, "../../logs/app.log");
  const logsDir = path.dirname(logPath);
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  return logPath;
};

/**
 * POST /signup
 * Create a single user
 */
router.post("/signup", validate(createUserSchema), async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const logPath = ensureLogsFolder();

  fs.appendFileSync(
    logPath,
    `[${req.requestId}] Creating user with email: ${email}\n`
  );

  try {
    const account = await AccountRepository.create({ firstName, lastName, email, password });

    // Add email job with retry/backoff
    await emailQueue.add(
      "sendEmail",
      { email, requestId: req.requestId },
      { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
    );

    fs.appendFileSync(
      logPath,
      `[${req.requestId}] Email job added to queue\n`
    );

    res.status(201).json({
      success: true,
      message: "User created",
      requestId: req.requestId,
      data: { id: account._id, fullName: account.fullName, email: account.email },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
        requestId: req.requestId,
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
      requestId: req.requestId,
    });
  }
});

/**
 * POST /signup-batch
 * Create multiple users (array)
 */
router.post("/signup-batch", async (req, res) => {
  const users = req.body; // expect array
  if (!Array.isArray(users)) {
    return res.status(400).json({ success: false, message: "Expected an array of users" });
  }

  const logPath = ensureLogsFolder();
  const results = [];

  for (const userData of users) {
    try {
      const account = await AccountRepository.create(userData);

      // Optionally add email job
      await emailQueue.add(
        "sendEmail",
        { email: account.email, requestId: req.requestId },
        { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
      );

      results.push({ email: account.email, status: "created" });
    } catch (err) {
      if (err.code === 11000) {
        results.push({ email: userData.email, status: "email exists" });
      } else {
        results.push({ email: userData.email, status: "error", message: err.message });
      }
    }
  }

  fs.appendFileSync(logPath, `[${req.requestId}] Batch signup completed\n`);

  res.status(200).json({
    success: true,
    message: "Batch signup processed",
    requestId: req.requestId,
    data: results,
  });
});

/**
 * GET /
 * Fetch all users
 */
router.get("/", async (req, res) => {
  const logPath = ensureLogsFolder();

  fs.appendFileSync(logPath, `[${req.requestId}] Fetching all users\n`);

  try {
    const users = await AccountRepository.findAll();

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      requestId: req.requestId,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      requestId: req.requestId,
    });
  }
});

/**
 * GET /paginated?limit=10&cursor=<last_id>
 * Cursor-based pagination
 */
router.get("/paginated", async (req, res) => {
  const { limit = 10, cursor } = req.query;
  const logPath = ensureLogsFolder();

  fs.appendFileSync(logPath, `[${req.requestId}] Fetching paginated users\n`);

  try {
    const users = await AccountRepository.findPaginated({
      limit: parseInt(limit),
      cursor,
    });

    res.status(200).json({
      success: true,
      message: "Paginated users fetched successfully",
      requestId: req.requestId,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      requestId: req.requestId,
    });
  }
});

module.exports = router;