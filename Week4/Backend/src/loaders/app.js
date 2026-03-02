const express = require("express");
const connectDB = require("./db");
const productRoutes = require("../routes/product.routes");
const emailRoutes = require("../routes/email.routes");
const applySecurity = require("../middlewares/security");
const requestIdMiddleware = require("../middlewares/requestId");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../config/swagger");

async function createApp() {
  const app = express();

  await connectDB();

  app.use(express.json());

  applySecurity(app);

  // 🔥 Attach requestId middleware EARLY
  app.use(requestIdMiddleware);

  // 🔥 Optional: Log every request with requestId
  app.use((req, res, next) => {
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl}`
    );
    next();
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use("/api/products", productRoutes);
  app.use("/api/email", emailRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
      requestId: req.requestId, // include requestId
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(`[${req.requestId}]`, err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      requestId: req.requestId, // include requestId
    });
  });

  return app;
}

module.exports = createApp;