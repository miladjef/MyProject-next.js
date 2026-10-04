import fs from "fs";
import mongoose from "mongoose";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const slugify = (value) => String(value || "").normalize("NFKC").trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 170);
if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required");
await mongoose.connect(process.env.MONGO_URL);
try {
  const products = mongoose.connection.collection("products");
  const items = await products.find({ $or: [{ slug: { $exists: false } }, { slug: "" }] }, { projection: { name: 1 } }).toArray();
  for (const product of items) {
    const base = slugify(product.name) || `product-${String(product._id)}`;
    let slug = base; let suffix = 1;
    while (await products.findOne({ slug, _id: { $ne: product._id } }, { projection: { _id: 1 } })) {
      suffix += 1; slug = `${base}-${suffix}`.slice(0, 190);
    }
    await products.updateOne({ _id: product._id }, { $set: { slug } });
  }
  console.log(`Backfilled ${items.length} product slugs.`);
} finally {
  await mongoose.disconnect();
}
