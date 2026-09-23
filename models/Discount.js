const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  percent: { type: Number, required: true, min: 1, max: 100 },
  maxUse: { type: Number, required: true, min: 1 },
  uses: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
const model = mongoose.models.Discount || mongoose.model("Discount", schema);
export default model;
