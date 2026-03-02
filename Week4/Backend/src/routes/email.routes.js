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

    await addEmailJob({ email });

    res.status(200).json({
      success: true,
      message: "Email job added to queue",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;