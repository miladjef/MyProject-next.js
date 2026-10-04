const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true },
    mode: { type: String, enum: ["login", "register", "reset", "change-phone"], required: true },
    expTime: { type: Number, required: true },
    times: { type: Number, default: 0 },
    lastSentAt: { type: Number, required: true },
  },
  { timestamps: true }
);

schema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });
const model = mongoose.models.Otp || mongoose.model("Otp", schema);
export default model;
