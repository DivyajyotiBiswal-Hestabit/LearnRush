const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending"
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});


// TTL index (auto delete expired orders)
OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// Compound index
OrderSchema.index({ status: 1, createdAt: -1 });


// Virtual example
OrderSchema.virtual("isHighValue").get(function () {
  return this.amount > 1000;
});

module.exports = mongoose.model("Order", OrderSchema);