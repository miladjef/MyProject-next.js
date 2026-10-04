import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import { authAdmin } from "@/utils/serverHelpers";
import { saveUploadedImage } from "@/utils/upload";
import { activeProductFilter } from "@/utils/productFilters";

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(req) {
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

    if (!name || name.length > 180 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) || !shortDescription || shortDescription.length > 1000 || !longDescription || longDescription.length > 20000 || !Number.isFinite(weight) || weight < 0 || !suitableFor || suitableFor.length > 500 || !smell || smell.length > 500 || tags.length === 0 || tags.some((tag) => tag.length > 80)) {
      return Response.json({ message: "Invalid product data" }, { status: 400 });
    }

    if (sku && await ProductModel.exists({ sku })) return Response.json({ message: "SKU already exists" }, { status: 409 });
    const imgUrl = await saveUploadedImage(formData.get("img"), { folder: "products", maxBytes: 5 * 1024 * 1024 });
    const product = await ProductModel.create({ name, sku: sku || undefined, price, stock, inventoryTracked, status, shortDescription, longDescription, weight, suitableFor, smell, tags, img: imgUrl });
    return Response.json({ message: "Product created successfully", data: product }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "SKU already exists" }, { status: 409 });
    const status = /image|product data/i.test(err.message || "") ? 400 : 500;
    return Response.json({ message: err.message || "Product creation failed" }, { status });
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
    let filter;
    if (status === "ACTIVE") {
      filter = { ...activeProductFilter };
    } else if (["DRAFT", "ARCHIVED"].includes(status)) {
      const admin = await authAdmin();
      if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
      filter = { status };
    } else {
      return Response.json({ message: "Invalid product status" }, { status: 400 });
    }
    if (q) {
      const safeQuery = escapeRegExp(q.slice(0, 120));
      const searchFilter = {
        $or: [
          { name: { $regex: safeQuery, $options: "i" } },
          { sku: { $regex: safeQuery, $options: "i" } },
          { tags: { $in: [new RegExp(safeQuery, "i")] } },
        ],
      };
      filter = { $and: [filter, searchFilter] };
    }

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .select("name sku price stock inventoryTracked status shortDescription weight suitableFor smell score tags img createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);
    return Response.json({ items: products, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return Response.json({ message: err.message || "Products fetch failed" }, { status: 500 });
  }
}
