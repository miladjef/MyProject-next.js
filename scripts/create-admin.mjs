import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

if (fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const required = ["MONGO_URL", "ADMIN_EMAIL", "ADMIN_PHONE", "ADMIN_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) { console.error(`Missing environment variables: ${missing.join(", ")}`); process.exit(1); }
if (String(process.env.ADMIN_PASSWORD).length < 12) { console.error("ADMIN_PASSWORD must be at least 12 characters"); process.exit(1); }
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const phone = process.env.ADMIN_PHONE.replace(/[\s()-]/g, "").trim();
const name = (process.env.ADMIN_NAME || "Milad Jafari Gavzan").trim();

try {
  await mongoose.connect(process.env.MONGO_URL);
  const exists = await User.findOne({ $or: [{ email }, { phone }] }).select("+password +tokenVersion");
  if (exists) {
    exists.name = name; exists.email = email; exists.phone = phone; exists.role = "ADMIN"; exists.isDeleted = false; exists.deletedAt = null; exists.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12); exists.tokenVersion = Number(exists.tokenVersion || 0) + 1; await exists.save();
    console.log(`Administrator updated: ${email}`);
  } else {
    await User.create({ name, email, phone, role: "ADMIN", password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) });
    console.log(`Administrator created: ${email}`);
  }
} finally { await mongoose.disconnect(); }
