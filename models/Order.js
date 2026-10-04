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

const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [itemSchema], required: true },
    address: {
      province: { type: String, required: true, trim: true, maxlength: 120 },
      city: { type: String, required: true, trim: true, maxlength: 120 },
      postalCode: { type: String, required: true, trim: true, maxlength: 20 },
      addressLine: { type: String, required: true, trim: true, maxlength: 800 },
    },
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
  },
  { timestamps: true }
);

schema.index({ user: 1, createdAt: -1 });
const model = mongoose.models.Order || mongoose.model("Order", schema);
export default model;
