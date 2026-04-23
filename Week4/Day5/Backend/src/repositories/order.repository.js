const Order = require("../models/Order");

class OrderRepository {

  static async create(data) {
    return await Order.create(data);
  }

  static async findById(id) {
    return await Order.findById(id);
  }

  static async findPaginated({ limit = 10, cursor }) {
    const query = cursor ? { _id: { $gt: cursor } } : {};

    return await Order.find(query)
      .sort({ _id: 1 })
      .limit(limit);
  }

  static async update(id, data) {
    return await Order.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    return await Order.findByIdAndDelete(id);
  }
}

module.exports = OrderRepository;