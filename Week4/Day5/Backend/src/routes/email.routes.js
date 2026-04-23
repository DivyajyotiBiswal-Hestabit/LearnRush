const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const { addEmailJob } = require("../jobs/email.job");

/**
 * @swagger
 * /api/email/send-email:
 *   post:
 *     summary: Send email via background queue
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email job added successfully
 */

router.post("/send-email", async (req, res) => {
  try {
    const { email } = req.body;

    await addEmailJob({
      email,
      requestId: req.requestId, // Pass requestId to worker
    });

    fs.appendFileSync(
      path.join(__dirname, "../../logs/app.log"),
      `[${req.requestId}] Email job added via /send-email\n`
    );

    res.status(200).json({
      success: true,
      message: "Email job added to queue",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
    });
  }
});

module.exports = router;