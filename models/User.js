const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "کاربر", maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
      unique: true,
      sparse: true,
      index: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
      maxlength: 20,
    },
    password: { type: String, required: false, select: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER", index: true },
    tokenVersion: { type: Number, default: 0, min: 0, select: false },
    avatar: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const model = mongoose.models.User || mongoose.model("User", schema);
module.exports = model;
