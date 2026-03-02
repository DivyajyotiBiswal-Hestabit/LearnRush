const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// Ensure logs folder exists
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function requestIdMiddleware(req, res, next) {
  const requestId = uuidv4();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  const logMessage = `[${requestId}] ${req.method} ${req.url}\n`;
  fs.appendFileSync(path.join(logDir, "app.log"), logMessage);

  console.log(logMessage.trim());

  next();
}

module.exports = requestIdMiddleware;