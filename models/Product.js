const mongoose = require("mongoose");
require("./Comment");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180, index: true },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true, index: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    inventoryTracked: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["ACTIVE", "DRAFT", "ARCHIVED"], default: "ACTIVE", index: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 1000 },
    longDescription: { type: String, required: true, trim: true, maxlength: 20000 },
    weight: { type: Number, required: true, min: 0 },
    suitableFor: { type: String, required: true, trim: true, maxlength: 500 },
    smell: { type: String, required: true, trim: true, maxlength: 500 },
    score: { type: Number, default: 5, min: 1, max: 5 },
    tags: { type: [String], default: [] },
    img: { type: String, required: true },
    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

schema.index({ status: 1, createdAt: -1 });
const model = mongoose.models.Product || mongoose.model("Product", schema);
export default model;
