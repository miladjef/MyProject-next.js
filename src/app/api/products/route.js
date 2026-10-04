import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import ProductCategoryModel from "@/models/ProductCategory";
import BrandModel from "@/models/Brand";
import { authAdmin } from "@/utils/serverHelpers";
import { removeLocalUpload, saveUploadedImage } from "@/utils/upload";
import { activeProductFilter } from "@/utils/productFilters";
import { ensureBrand, ensureCategory, uniqueProductSlug } from "@/utils/catalog";
import { safeServerError } from "@/utils/apiError";
import { revalidateTag } from "next/cache";

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(req) {
  const createdFiles = [];
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const name = String(formData.get("name") || "").trim();
    const sku = String(formData.get("sku") || "").trim().toUpperCase();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock") || 0);
    const inventoryTracked = String(formData.get("inventoryTracked") || "false") === "true";
    const status = String(formData.get("status") || "ACTIVE").toUpperCase();
    const shortDescription = String(formData.get("shortDescription") || "").trim();
    const longDescription = String(formData.get("longDescription") || "").trim();
    const weight = Number(formData.get("weight"));
    const suitableFor = String(formData.get("suitableFor") || "").trim();
    const smell = String(formData.get("smell") || "").trim();
    const tags = String(formData.get("tags") || "").split(/[،,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 30);
    const categoryName = String(formData.get("category") || "").trim();
    const brandName = String(formData.get("brand") || "").trim();
    const imgAlt = String(formData.get("imgAlt") || name).trim().slice(0, 220);

    if (!name || name.length > 180 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) || !shortDescription || shortDescription.length > 1000 || !longDescription || longDescription.length > 20000 || !Number.isFinite(weight) || weight < 0 || !suitableFor || suitableFor.length > 500 || !smell || smell.length > 500 || tags.length === 0 || tags.some((tag) => tag.length > 80)) {
      return Response.json({ message: "Invalid product data" }, { status: 400 });
    }

    if (sku && await ProductModel.exists({ sku })) return Response.json({ message: "SKU already exists" }, { status: 409 });
    const [category, brand, slug] = await Promise.all([
      ensureCategory(categoryName),
      ensureBrand(brandName),
      uniqueProductSlug(formData.get("slug") || name),
    ]);

    const imgUrl = await saveUploadedImage(formData.get("img"), { folder: "products", maxBytes: 5 * 1024 * 1024 });
    createdFiles.push(imgUrl);
    const galleryFiles = formData.getAll("gallery").filter((file) => file && typeof file.arrayBuffer === "function" && file.size).slice(0, 8);
    const gallery = [];
    for (const file of galleryFiles) {
      const url = await saveUploadedImage(file, { folder: "products", maxBytes: 5 * 1024 * 1024 });
      createdFiles.push(url);
      gallery.push({ url, alt: imgAlt });
    }

    const product = await ProductModel.create({
      name, slug, sku: sku || undefined, category: category?._id || null, brand: brand?._id || null,
      price, stock, inventoryTracked, status, shortDescription, longDescription, weight, suitableFor, smell,
      tags, img: imgUrl, imgAlt, gallery,
    });
    revalidateTag("products");
    return Response.json({ message: "Product created successfully", data: product }, { status: 201 });
  } catch (err) {
    await Promise.all(createdFiles.map((file) => removeLocalUpload(file).catch(() => {})));
    if (err?.code === 11000) return Response.json({ message: "SKU or product slug already exists" }, { status: 409 });
    if (/image|product data/i.test(err?.message || "")) return Response.json({ message: "Invalid product image or data" }, { status: 400 });
    return safeServerError(err, "products.create");
  }
}

export async function GET(req) {
  try {
    await connectToDB();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 24));
    const q = String(url.searchParams.get("q") || "").trim();
    const status = String(url.searchParams.get("status") || "ACTIVE").toUpperCase();
    const categorySlug = String(url.searchParams.get("category") || "").trim();
    const brandSlug = String(url.searchParams.get("brand") || "").trim();
    let filter;
    if (status === "ACTIVE") filter = { ...activeProductFilter };
    else if (["DRAFT", "ARCHIVED"].includes(status)) {
      const admin = await authAdmin();
      if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
      filter = { status };
    } else return Response.json({ message: "Invalid product status" }, { status: 400 });

    if (categorySlug) {
      const category = await ProductCategoryModel.findOne({ slug: categorySlug, isActive: true }).select("_id").lean();
      if (!category) return Response.json({ items: [], pagination: { page, limit, total: 0, pages: 1 } });
      filter.category = category._id;
    }
    if (brandSlug) {
      const brand = await BrandModel.findOne({ slug: brandSlug, isActive: true }).select("_id").lean();
      if (!brand) return Response.json({ items: [], pagination: { page, limit, total: 0, pages: 1 } });
      filter.brand = brand._id;
    }
    if (q) {
      const safeQuery = escapeRegExp(q.slice(0, 120));
      filter = { $and: [filter, { $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { sku: { $regex: `^${safeQuery}`, $options: "i" } },
        { tags: { $in: [new RegExp(safeQuery, "i")] } },
      ] }] };
    }

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .select("name slug sku category brand price stock inventoryTracked status shortDescription weight suitableFor smell score tags img imgAlt gallery createdAt")
        .populate("category", "name slug")
        .populate("brand", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);
    return Response.json({ items: products, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return safeServerError(err, "products.list");
  }
}
