const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "کاربر",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    refreshToken: String,
  },
  { timestamps: true }
);

const model = mongoose.models.User || mongoose.model("User", schema);
module.exports = model;
