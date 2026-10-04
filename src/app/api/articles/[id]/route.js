import connectToDB from "@/configs/db";
import { isValidObjectId } from "mongoose";
import ArticleModel from "@/models/Article";
import { authAdmin } from "@/utils/serverHelpers";
import { removeLocalUpload, saveUploadedImage } from "@/utils/upload";

const slugify = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\p{L}\p{N}-]+/gu, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid article id" }, { status: 400 });
    const article = await ArticleModel.findById(id);
    if (!article) return Response.json({ message: "Article not found" }, { status: 404 });

    const type = req.headers.get("content-type") || "";
    let payload = {};
    let image = null;
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const key of ["title", "slug", "excerpt", "body", "author", "tags", "status"]) {
        if (form.has(key)) payload[key] = form.get(key);
      }
      image = form.get("img");
    } else {
      payload = await req.json();
    }

    if (payload.title !== undefined) article.title = String(payload.title).trim();
    if (payload.excerpt !== undefined) article.excerpt = String(payload.excerpt).trim();
    if (payload.body !== undefined) article.body = String(payload.body).trim();
    if (payload.author !== undefined) article.author = String(payload.author).trim();
    if (payload.slug !== undefined) article.slug = slugify(payload.slug || article.title);
    if (payload.tags !== undefined) {
      article.tags = Array.isArray(payload.tags)
        ? payload.tags.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 30)
        : String(payload.tags).split(/[،,]/).map((v) => v.trim()).filter(Boolean).slice(0, 30);
    }
    if (payload.status !== undefined) {
      const nextStatus = String(payload.status).toUpperCase();
      if (!["DRAFT", "PUBLISHED"].includes(nextStatus)) return Response.json({ message: "Invalid article status" }, { status: 400 });
      if (nextStatus === "PUBLISHED" && article.status !== "PUBLISHED") article.publishedAt = new Date();
      article.status = nextStatus;
    }

    if (!article.title || article.title.length > 220 || !article.slug || article.slug.length > 220 || article.excerpt.length > 600 || !article.body || article.body.length > 50000 || article.author.length > 120) {
      return Response.json({ message: "Invalid article data" }, { status: 400 });
    }

    if (image && typeof image.arrayBuffer === "function" && image.size) {
      const old = article.img;
      article.img = await saveUploadedImage(image, { folder: "articles", maxBytes: 5 * 1024 * 1024 });
      await removeLocalUpload(old);
    }

    await article.save();
    return Response.json({ message: "Article updated", data: article });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "Article slug already exists" }, { status: 409 });
    return Response.json({ message: err.message || "Article update failed" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid article id" }, { status: 400 });
    const article = await ArticleModel.findByIdAndDelete(id);
    if (!article) return Response.json({ message: "Article not found" }, { status: 404 });
    await removeLocalUpload(article.img);
    return Response.json({ message: "Article deleted" });
  } catch (err) {
    return Response.json({ message: err.message || "Article delete failed" }, { status: 500 });
  }
}
