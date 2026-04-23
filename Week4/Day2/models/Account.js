const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const AccountSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active"
  }
}, {
  timestamps: true
});


// Virtual field
AccountSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});


// Pre-save hook (hash password)
AccountSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await require("bcrypt").hash(this.password, 10);
});


// Compound index for query performance
AccountSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Account", AccountSchema);