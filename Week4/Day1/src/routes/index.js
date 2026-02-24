const express = require("express");
const logger = require("../utils/logger");

module.exports = function loadRoutes(app) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ status: "OK" });
  });

  app.use("/api", router);

  logger.info("Routes mounted: 1 endpoint");
};