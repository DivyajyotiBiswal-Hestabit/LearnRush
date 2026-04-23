const Product = require("../models/Product");

// CREATE
const create = async (payload) => {
  return await Product.create(payload);
};

// FIND WITH FILTERS
const findWithFilters = async (query, options) => {
  return await Product.find(query)
    .skip(options.skip)
    .limit(options.limit)
    .sort(options.sort);
};

// SOFT DELETE
const softDelete = async (id) => {
  return await Product.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true }
  );
};

module.exports = {
  create,
  findWithFilters,
  softDelete,
};