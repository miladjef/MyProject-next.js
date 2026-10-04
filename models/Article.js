const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true, maxlength: 220 },
    excerpt: { type: String, trim: true, maxlength: 600, default: "" },
    body: { type: String, required: true, trim: true, maxlength: 50000 },
    img: { type: String, default: "" },
    author: { type: String, trim: true, maxlength: 120, default: "Milad Jafari Gavzan" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT", index: true },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

const model = mongoose.models.Article || mongoose.model("Article", schema);
export default model;
