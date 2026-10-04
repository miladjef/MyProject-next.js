const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    company: { type: String, trim: true, maxlength: 160, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);
const model = mongoose.models.Contact || mongoose.model("Contact", schema);
export default model;
