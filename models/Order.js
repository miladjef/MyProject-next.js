const mongoose = require("mongoose");
require("./User");
require("./Product");

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    img: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    count: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    changedBy: { type: mongoose.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: "", maxlength: 500 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, trim: true, default: "", maxlength: 128 },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
    recipientName: { type: String, trim: true, default: "مشتری", maxlength: 120 },
    recipientPhone: { type: String, trim: true, default: "", maxlength: 20 },
    items: { type: [itemSchema], required: true },
    address: {
      province: { type: String, required: true, trim: true, maxlength: 120 },
      city: { type: String, required: true, trim: true, maxlength: 120 },
      postalCode: { type: String, required: true, trim: true, maxlength: 20 },
      addressLine: { type: String, required: true, trim: true, maxlength: 800 },
    },
    shippingMethod: { type: String, enum: ["STANDARD", "EXPRESS", "PICKUP"], default: "STANDARD" },
    trackingCode: { type: String, trim: true, default: "", maxlength: 120 },
    subtotal: { type: Number, required: true, min: 0 },
    discountCode: { type: String, default: "" },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
    paymentMethod: { type: String, enum: ["COD", "MANUAL", "GATEWAY"], default: "COD" },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

schema.index({ user: 1, createdAt: -1 });
schema.index({ createdAt: -1, status: 1 });
schema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string", $gt: "" } } });
schema.index({ trackingCode: 1 }, { sparse: true });
const model = mongoose.models.Order || mongoose.model("Order", schema);
export default model;
