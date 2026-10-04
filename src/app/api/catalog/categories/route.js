import connectToDB from "@/configs/db";
import ProductCategoryModel from "@/models/ProductCategory";
import { authAdmin } from "@/utils/serverHelpers";
import { slugify } from "@/utils/slug.mjs";
import { safeServerError } from "@/utils/apiError";

export async function GET() {
  await connectToDB();
  const items = await ProductCategoryModel.find({ isActive: true }).sort({ name: 1 }).lean();
  return Response.json({ items });
}
export async function POST(req) {
  try {
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { name, description = "" } = await req.json();
    const cleanName = String(name || "").trim(); const slug = slugify(cleanName);
    if (!cleanName || !slug) return Response.json({ message: "Invalid category" }, { status: 400 });
    const item = await ProductCategoryModel.findOneAndUpdate({ slug }, { $set: { name: cleanName, description: String(description).slice(0, 1200), isActive: true } }, { upsert: true, new: true });
    return Response.json({ item }, { status: 201 });
  } catch (err) { return safeServerError(err, "catalog.category"); }
}
