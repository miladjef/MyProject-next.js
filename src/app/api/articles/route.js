import connectToDB from "@/configs/db";
import ArticleModel from "@/models/Article";
import { authAdmin } from "@/utils/serverHelpers";
import { saveUploadedImage } from "@/utils/upload";

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-").replace(/^-|-$/g, "");

export async function GET(req) {
  await connectToDB();
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const q = String(url.searchParams.get("q") || "").trim();
  const filter = { status: "PUBLISHED" };
  if (q) {
    const safeQuery = escapeRegExp(q.slice(0, 120));
    filter.$or = [{ title: { $regex: safeQuery, $options: "i" } }, { tags: { $in: [new RegExp(safeQuery, "i")] } }];
  }
  const [items, total] = await Promise.all([
    ArticleModel.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("title slug excerpt img author tags publishedAt createdAt").lean(),
    ArticleModel.countDocuments(filter),
  ]);
  return Response.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function POST(req) {
  try {
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    await connectToDB();
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    const excerpt = String(form.get("excerpt") || "").trim();
    const author = String(form.get("author") || admin.name || "Milad Jafari Gavzan").trim();
    const status = String(form.get("status") || "DRAFT").toUpperCase();
    const tags = String(form.get("tags") || "").split(/[،,]/).map((v) => v.trim()).filter(Boolean).slice(0, 30);
    const slug = slugify(form.get("slug") || title);
    if (!title || !body || !slug || !["DRAFT", "PUBLISHED"].includes(status)) return Response.json({ message: "Invalid article data" }, { status: 400 });
    let img = "";
    const file = form.get("img");
    if (file && typeof file.arrayBuffer === "function" && file.size) img = await saveUploadedImage(file, { folder: "articles", maxBytes: 5 * 1024 * 1024 });
    const article = await ArticleModel.create({ title, slug, body, excerpt, author, tags, status, img, publishedAt: status === "PUBLISHED" ? new Date() : null });
    return Response.json({ message: "Article created", data: article }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "Article slug already exists" }, { status: 409 });
    return Response.json({ message: err.message || "Article creation failed" }, { status: 500 });
  }
}
