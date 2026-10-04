const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true, maxlength: 180 },
  description: { type: String, trim: true, default: "", maxlength: 1200 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true });
const model = mongoose.models.Brand || mongoose.model("Brand", schema);
export default model;
