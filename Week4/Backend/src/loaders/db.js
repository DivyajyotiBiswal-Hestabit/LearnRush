const mongoose = require("mongoose");
const config = require("../config");
const logger = require("../utils/logger");

module.exports = async function loadDB() {
  try {
    await mongoose.connect(config.dbUri);

    logger.info("Database connected");
  } catch (err) {
    logger.error("Database connection failed");
    process.exit(1);
  }
};