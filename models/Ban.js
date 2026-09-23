const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.models.Ban || mongoose.model("Ban", schema);

export default model;
