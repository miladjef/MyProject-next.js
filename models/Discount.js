const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true, maxlength: 64 },
    percent: { type: Number, required: true, min: 1, max: 100 },
    maxUse: { type: Number, required: true, min: 1 },
    uses: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    perUserLimit: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);
const model = mongoose.models.Discount || mongoose.model("Discount", schema);
export default model;
