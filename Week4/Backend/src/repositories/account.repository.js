const Account = require("../models/Account");

class AccountRepository {

  static async create(data) {
    return await Account.create(data);
  }

  static async findById(id) {
    return await Account.findById(id);
  }

  static async findPaginated({ limit = 10, cursor }) {
    const query = cursor ? { _id: { $gt: cursor } } : {};

    return await Account.find(query)
      .sort({ _id: 1 })
      .limit(limit);
  }

  static async update(id, data) {
    return await Account.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id) {
    return await Account.findByIdAndDelete(id);
  }
}

module.exports = AccountRepository;