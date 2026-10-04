const mongoose = require("mongoose");
require("./Discount");
require("./User");

const schema = new mongoose.Schema({
  discount: { type: mongoose.Types.ObjectId, ref: "Discount", required: true, index: true },
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
  count: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
schema.index({ discount: 1, user: 1 }, { unique: true });
const model = mongoose.models.DiscountUsage || mongoose.model("DiscountUsage", schema);
export default model;
