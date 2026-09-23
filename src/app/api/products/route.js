import crypto from "crypto";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authAdmin } from "@/utils/serverHelpers";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const saveImage = async (img) => {
  if (!img || typeof img.arrayBuffer !== "function") throw new Error("Product image is required");
  if (!ALLOWED_IMAGE_TYPES.has(img.type)) throw new Error("Unsupported image type");
  if (img.size > MAX_IMAGE_SIZE) throw new Error("Image is too large");

  const extByType = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
  const filename = `${crypto.randomUUID()}${extByType[img.type]}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await img.arrayBuffer()));
  return `/uploads/${filename}`;
};

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const name = String(formData.get("name") || "").trim();
    const price = Number(formData.get("price"));
    const shortDescription = String(formData.get("shortDescription") || "").trim();
    const longDescription = String(formData.get("longDescription") || "").trim();
    const weight = Number(formData.get("weight"));
    const suitableFor = String(formData.get("suitableFor") || "").trim();
    const smell = String(formData.get("smell") || "").trim();
    const tags = String(formData.get("tags") || "")
      .split(/[،,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    const img = formData.get("img");

    if (!name || !Number.isFinite(price) || price < 0 || !shortDescription || !longDescription || !Number.isFinite(weight) || weight < 0 || !suitableFor || !smell || tags.length === 0) {
      return Response.json({ message: "Invalid product data" }, { status: 400 });
    }

    const imgUrl = await saveImage(img);
    const product = await ProductModel.create({ name, price, shortDescription, longDescription, weight, suitableFor, smell, tags, img: imgUrl });
    return Response.json({ message: "Product created successfully", data: product }, { status: 201 });
  } catch (err) {
    const status = /image|product data/i.test(err.message || "") ? 400 : 500;
    return Response.json({ message: err.message || "Product creation failed" }, { status });
  }
}

export async function PUT(req) {
  try {
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const formData = await req.formData();
    const imgUrl = await saveImage(formData.get("img"));
    return Response.json({ message: "File uploaded successfully", url: imgUrl }, { status: 201 });
  } catch (err) {
    const status = /image/i.test(err.message || "") ? 400 : 500;
    return Response.json({ message: err.message || "Upload failed" }, { status });
  }
}

export async function GET() {
  try {
    await connectToDB();
    const products = await ProductModel.find({}, "-__v").populate({
      path: "comments",
      match: { isAccept: true },
      select: "username body score date createdAt",
    });
    return Response.json(products);
  } catch (err) {
    return Response.json({ message: err.message || "Products fetch failed" }, { status: 500 });
  }
}
