const service = require("../services/product.service");

// CREATE PRODUCT
exports.createProduct = async (req, res, next) => {
  try {
    const product = await service.createProduct(req.body);

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (err) {
    next(err);
  }
};


// GET PRODUCTS
exports.getProducts = async (req, res, next) => {
  try {
    const data = await service.getProducts(req.query);

    res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err);
  }
};


// SOFT DELETE PRODUCT
exports.deleteProduct = async (req, res, next) => {
  try {
    await service.deleteProduct(req.params.id);

    res.json({
      success: true,
      message: "Soft deleted"
    });

  } catch (err) {
    next(err);
  }
};