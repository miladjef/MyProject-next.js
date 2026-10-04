const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120, unique: true, index: true },
}, { timestamps: true });
const model = mongoose.models.Department || mongoose.model("Department", schema);
export default model;
