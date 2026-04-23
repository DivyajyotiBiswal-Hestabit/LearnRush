const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

const applySecurity = (app) => {
  app.use(helmet());

   

  app.use(hpp());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(","),
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests from this IP",
        code: "RATE_LIMIT_EXCEEDED",
      },
    })
  );
};

module.exports = applySecurity;