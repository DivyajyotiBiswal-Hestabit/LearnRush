require("./config");

const http = require("http");
const createApp = require("./loaders/app"); // returns configured Express app
const config = require("./config");
const logger = require("./utils/logger");

async function startServer() {
  const app = await createApp(); // app already has express.json(), helmet, cors, routes, etc.

  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
  });

  const shutdown = () => {
    logger.info("Shutting down gracefully...");

    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();