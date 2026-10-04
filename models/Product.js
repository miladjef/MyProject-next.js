const mongoose = require("mongoose");
require("./Comment");
require("./ProductCategory");
require("./Brand");

const gallerySchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "", maxlength: 220 },
}, { _id: false });

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180, index: true },
    slug: { type: String, trim: true, lowercase: true, default: "", maxlength: 190 },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true, index: true, maxlength: 80 },
    category: { type: mongoose.Types.ObjectId, ref: "ProductCategory", default: null, index: true },
    brand: { type: mongoose.Types.ObjectId, ref: "Brand", default: null, index: true },
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
    imgAlt: { type: String, default: "", maxlength: 220 },
    gallery: { type: [gallerySchema], default: [] },
    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

schema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string", $gt: "" } } });
schema.index({ status: 1, createdAt: -1 });
schema.index({ status: 1, category: 1, brand: 1, createdAt: -1 });
schema.index({ name: "text", sku: "text", tags: "text" }, { default_language: "none" });
const model = mongoose.models.Product || mongoose.model("Product", schema);
export default model;
