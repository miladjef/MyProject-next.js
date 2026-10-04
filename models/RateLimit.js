const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0, min: 0 },
    resetAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const model = mongoose.models.RateLimit || mongoose.model("RateLimit", schema);
export default model;
