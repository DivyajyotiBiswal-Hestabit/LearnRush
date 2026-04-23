const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("../utils/logger");
const errorMiddleware = require("./error.middleware");

module.exports = function loadMiddlewares(app) {
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(morgan("combined"));

  logger.info("Middlewares loaded");

  // MUST BE LAST
  app.use(errorMiddleware);
};