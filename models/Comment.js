const mongoose = require("mongoose"); require("./Product"); require("./User");
const schema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  email: { type: String, required: true, trim: true, lowercase: true },
  score: { type: Number, default: 5, min: 1, max: 5 },
  isAccept: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  productID: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  user: { type: mongoose.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const model = mongoose.models.Comment || mongoose.model("Comment", schema);
export default model;
