const express = require("express");
const productController = require("../controllers/product.controller");
const validate = require("../middlewares/validate");
const { createProductSchema } = require("../validations/product.schema");

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */

const router = express.Router();

router.get("/", productController.getProducts);

router.post(
  "/",
  validate(createProductSchema),          // Validation layer added
  productController.createProduct
);

router.delete(
  "/:id",
  productController.deleteProduct
);

module.exports = router;