const mongoose = require("mongoose");
require("./Order");
require("./User");

const schema = new mongoose.Schema(
  {
    order: { type: mongoose.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["COD", "MANUAL", "GATEWAY"], required: true },
    status: { type: String, enum: ["PENDING", "PAID", "FAILED", "REFUNDED"], default: "PENDING", index: true },
    reference: { type: String, trim: true, default: "", maxlength: 180 },
    providerPayload: { type: mongoose.Schema.Types.Mixed, select: false },
  },
  { timestamps: true }
);

const model = mongoose.models.Payment || mongoose.model("Payment", schema);
export default model;
