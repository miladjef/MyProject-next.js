import { isValidObjectId } from "mongoose";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import { authAdmin } from "@/utils/serverHelpers";
import { removeLocalUpload, saveUploadedImage } from "@/utils/upload";
import { activeProductFilter } from "@/utils/productFilters";

const editable = [
  "name",
  "sku",
  "price",
  "stock",
  "inventoryTracked",
  "status",
  "shortDescription",
  "longDescription",
  "weight",
  "suitableFor",
  "smell",
  "tags",
];

export async function GET(_req, { params }) {
  await connectToDB();
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ message: "Invalid product id" }, { status: 400 });
  }
  const product = await ProductModel.findOne({ _id: id, ...activeProductFilter })
    .populate({
      path: "comments",
      match: { isAccept: true },
      select: "username body score adminReply createdAt",
    })
    .lean();
  if (!product) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }
  return Response.json(product);
}

export async function PATCH(req, { params }) {
  let newImage = "";
  let oldImage = "";
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return Response.json({ message: "Invalid product id" }, { status: 400 });
    }

    const product = await ProductModel.findById(id);
    if (!product) {
      return Response.json({ message: "Product not found" }, { status: 404 });
    }

    let body = {};
    const type = req.headers.get("content-type") || "";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const key of editable) {
        if (form.has(key)) body[key] = form.get(key);
      }
      const image = form.get("img");
      if (image && typeof image.arrayBuffer === "function" && image.size) {
        newImage = await saveUploadedImage(image, {
          folder: "products",
          maxBytes: 5 * 1024 * 1024,
        });
        oldImage = product.img;
        product.img = newImage;
      }
    } else {
      body = await req.json();
    }

    for (const key of editable) {
      if (!(key in body)) continue;
      if (["price", "stock", "weight"].includes(key)) {
        product[key] = Number(body[key]);
      } else if (key === "inventoryTracked") {
        product[key] = body[key] === true || String(body[key]) === "true";
      } else if (key === "tags") {
        product[key] = Array.isArray(body[key])
          ? body[key]
              .map(String)
              .map((value) => value.trim())
              .filter(Boolean)
              .slice(0, 30)
          : String(body[key])
              .split(/[،,]/)
              .map((value) => value.trim())
              .filter(Boolean)
              .slice(0, 30);
      } else {
        product[key] = String(body[key]).trim();
      }
    }

    if (
      !product.name ||
      product.name.length > 180 ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0 ||
      !["ACTIVE", "DRAFT", "ARCHIVED"].includes(product.status) ||
      !product.shortDescription ||
      product.shortDescription.length > 1000 ||
      !product.longDescription ||
      product.longDescription.length > 20000 ||
      !Number.isFinite(product.weight) ||
      product.weight < 0 ||
      !product.suitableFor ||
      product.suitableFor.length > 500 ||
      !product.smell ||
      product.smell.length > 500 ||
      !Array.isArray(product.tags) ||
      product.tags.length > 30 ||
      product.tags.some((tag) => String(tag).length > 80)
    ) {
      if (newImage) await removeLocalUpload(newImage);
      return Response.json({ message: "Invalid product data" }, { status: 400 });
    }

    if (product.sku) product.sku = product.sku.toUpperCase();
    await product.save();
    if (newImage && oldImage && oldImage !== newImage) {
      await removeLocalUpload(oldImage);
    }
    return Response.json({ message: "Product updated successfully" });
  } catch (err) {
    if (newImage) await removeLocalUpload(newImage).catch(() => {});
    if (err?.code === 11000) {
      return Response.json({ message: "SKU already exists" }, { status: 409 });
    }
    return Response.json(
      { message: err.message || "Product update failed" },
      { status: /image/i.test(err.message || "") ? 400 : 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ message: "Invalid product id" }, { status: 400 });
  }
  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }
  await removeLocalUpload(product.img);
  return Response.json({ message: "Product deleted successfully" });
}
