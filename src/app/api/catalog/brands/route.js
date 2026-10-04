import connectToDB from "@/configs/db";
import BrandModel from "@/models/Brand";
import { authAdmin } from "@/utils/serverHelpers";
import { slugify } from "@/utils/slug.mjs";
import { safeServerError } from "@/utils/apiError";

export async function GET() {
  await connectToDB();
  const items = await BrandModel.find({ isActive: true }).sort({ name: 1 }).lean();
  return Response.json({ items });
}
export async function POST(req) {
  try {
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { name, description = "" } = await req.json();
    const cleanName = String(name || "").trim(); const slug = slugify(cleanName);
    if (!cleanName || !slug) return Response.json({ message: "Invalid brand" }, { status: 400 });
    const item = await BrandModel.findOneAndUpdate({ slug }, { $set: { name: cleanName, description: String(description).slice(0, 1200), isActive: true } }, { upsert: true, new: true });
    return Response.json({ item }, { status: 201 });
  } catch (err) { return safeServerError(err, "catalog.brand"); }
}
