const mongoose = require("mongoose");
require("./Department");
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  department: { type: mongoose.Types.ObjectId, ref: "Department", required: true, index: true },
}, { timestamps: true });
schema.index({ department: 1, title: 1 }, { unique: true });
const model = mongoose.models.SubDepartment || mongoose.model("SubDepartment", schema);
export default model;
