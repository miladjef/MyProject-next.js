import { isValidObjectId } from "mongoose";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import { authAdmin } from "@/utils/serverHelpers";
import { removeLocalUpload, saveUploadedImage } from "@/utils/upload";
import { activeProductFilter } from "@/utils/productFilters";
import { ensureBrand, ensureCategory, uniqueProductSlug } from "@/utils/catalog";
import { safeServerError } from "@/utils/apiError";
import { safeDecodeURIComponent } from "@/utils/url";
import { revalidateTag } from "next/cache";

const productLookup = (id) => isValidObjectId(id) ? { _id: id } : { slug: safeDecodeURIComponent(id) };
const editable = ["name", "slug", "sku", "price", "stock", "inventoryTracked", "status", "shortDescription", "longDescription", "weight", "suitableFor", "smell", "tags", "imgAlt"];

export async function GET(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const product = await ProductModel.findOne({ ...productLookup(id), ...activeProductFilter })
      .populate({ path: "comments", match: { isAccept: true }, select: "username body score adminReply createdAt" })
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .lean();
    if (!product) return Response.json({ message: "Product not found" }, { status: 404 });
    return Response.json(product);
  } catch (err) {
    return safeServerError(err, "products.get");
  }
}

export async function PATCH(req, { params }) {
  const createdFiles = [];
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const product = await ProductModel.findOne(productLookup(id));
    if (!product) return Response.json({ message: "Product not found" }, { status: 404 });

    let body = {};
    const type = req.headers.get("content-type") || "";
    let newImage = "";
    let oldImage = "";
    let oldGalleryToRemove = [];
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const key of editable) if (form.has(key)) body[key] = form.get(key);
      if (form.has("category")) body.category = form.get("category");
      if (form.has("brand")) body.brand = form.get("brand");
      const image = form.get("img");
      if (image && typeof image.arrayBuffer === "function" && image.size) {
        newImage = await saveUploadedImage(image, { folder: "products", maxBytes: 5 * 1024 * 1024 });
        createdFiles.push(newImage); oldImage = product.img; product.img = newImage;
      }
      const galleryFiles = form.getAll("gallery").filter((file) => file && typeof file.arrayBuffer === "function" && file.size).slice(0, 8);
      if (galleryFiles.length) {
        oldGalleryToRemove = Array.isArray(product.gallery) ? product.gallery.map((entry) => entry.url) : [];
        const gallery = [];
        for (const file of galleryFiles) {
          const url = await saveUploadedImage(file, { folder: "products", maxBytes: 5 * 1024 * 1024 });
          createdFiles.push(url); gallery.push({ url, alt: String(body.imgAlt || product.imgAlt || product.name).slice(0, 220) });
        }
        product.gallery = gallery;
      }
    } else body = await req.json();

    for (const key of editable) {
      if (!(key in body)) continue;
      if (["price", "stock", "weight"].includes(key)) product[key] = Number(body[key]);
      else if (key === "inventoryTracked") product[key] = body[key] === true || String(body[key]) === "true";
      else if (key === "tags") product[key] = Array.isArray(body[key]) ? body[key].map(String).map((v) => v.trim()).filter(Boolean).slice(0, 30) : String(body[key]).split(/[،,]/).map((v) => v.trim()).filter(Boolean).slice(0, 30);
      else product[key] = String(body[key]).trim();
    }

    if (body.category !== undefined) product.category = (await ensureCategory(body.category))?._id || null;
    if (body.brand !== undefined) product.brand = (await ensureBrand(body.brand))?._id || null;
    if (!product.slug || body.slug !== undefined || body.name !== undefined) product.slug = await uniqueProductSlug(body.slug || product.name, product._id);
    if (product.sku) product.sku = product.sku.toUpperCase();

    if (!product.name || product.name.length > 180 || !product.slug || !Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0 || !["ACTIVE", "DRAFT", "ARCHIVED"].includes(product.status) || !product.shortDescription || !product.longDescription || !Number.isFinite(product.weight) || product.weight < 0 || !product.suitableFor || !product.smell || !Array.isArray(product.tags) || product.tags.length > 30) {
      await Promise.all(createdFiles.map((file) => removeLocalUpload(file).catch(() => {})));
      return Response.json({ message: "Invalid product data" }, { status: 400 });
    }

    await product.save();
    revalidateTag("products");
    if (newImage && oldImage && oldImage !== newImage) await removeLocalUpload(oldImage);
    if (oldGalleryToRemove.length) await Promise.all(oldGalleryToRemove.map((url) => removeLocalUpload(url).catch(() => {})));
    return Response.json({ message: "Product updated successfully", data: product });
  } catch (err) {
    await Promise.all(createdFiles.map((file) => removeLocalUpload(file).catch(() => {})));
    if (err?.code === 11000) return Response.json({ message: "SKU or product slug already exists" }, { status: 409 });
    if (/image/i.test(err?.message || "")) return Response.json({ message: "Invalid image" }, { status: 400 });
    return safeServerError(err, "products.update");
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const product = await ProductModel.findOneAndUpdate(productLookup(id), { $set: { status: "ARCHIVED" } }, { new: true });
    if (!product) return Response.json({ message: "Product not found" }, { status: 404 });
    revalidateTag("products");
    return Response.json({ message: "Product archived successfully" });
  } catch (err) {
    return safeServerError(err, "products.archive");
  }
}
