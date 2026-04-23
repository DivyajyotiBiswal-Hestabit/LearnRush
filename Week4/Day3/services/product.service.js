const repo = require("../repositories/product.repository");
const AppError = require("../errors/AppError");

class ProductService {
  // ✅ CREATE
  async createProduct(payload) {
    return await repo.create(payload);
  }

  // 🔎 Query builder
  buildQuery(params) {
    const query = {};

    if (!params.includeDeleted) {
      query.deletedAt = null;
    }

    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: "i" } },
        { description: { $regex: params.search, $options: "i" } },
      ];
    }

    if (params.minPrice || params.maxPrice) {
      query.price = {};
      if (params.minPrice) query.price.$gte = Number(params.minPrice);
      if (params.maxPrice) query.price.$lte = Number(params.maxPrice);
    }

    if (params.tags) {
      query.tags = { $in: params.tags.split(",") };
    }

    return query;
  }

  buildOptions(params) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);

    let sort = {};
    if (params.sort) {
      const [field, dir] = params.sort.split(":");
      sort[field] = dir === "desc" ? -1 : 1;
    }

    return {
      skip: (page - 1) * limit,
      limit,
      sort,
    };
  }

  // ✅ GET
  async getProducts(params) {
    const query = this.buildQuery(params);
    const options = this.buildOptions(params);
    return repo.findWithFilters(query, options);
  }

  // ✅ DELETE
  async deleteProduct(id) {
    const result = await repo.softDelete(id);

    if (!result) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    return result;
  }
}

module.exports = new ProductService();