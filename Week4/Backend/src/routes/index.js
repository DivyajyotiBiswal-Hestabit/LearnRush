const logger = require("../utils/logger");

const healthRoutes = require("./health.routes");
const productRoutes = require("./product.routes");
const emailRoutes = require("./email.routes");

router.use("/email", emailRoutes);

module.exports = function loadRoutes(app) {
  app.use("/api", healthRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/email", emailRoutes);
  logger.info("Routes mounted: health + products");
};