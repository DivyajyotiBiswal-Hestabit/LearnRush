const express = require("express");
const loadDB = require("./db");
const loadMiddlewares = require("../middlewares");
const loadRoutes = require("../routes");
const logger = require("../utils/logger");

module.exports = async function createApp() {
  const app = express();

  await loadDB();

  loadMiddlewares(app);

  loadRoutes(app);

  logger.info("App loaded successfully");

  return app;
};