import { isValidObjectId } from "mongoose";
import ProductModel from "@/models/Product";
import DiscountModel from "@/models/Discount";
import OrderModel from "@/models/Order";
import connectToDB from "@/configs/db";
import { activeProductFilter } from "@/utils/productFilters";

const SHIPPING_COST = Math.max(0, Number(process.env.SHIPPING_COST || 30000));

const normalizeItems = (items) => {
  if (!Array.isArray(items) || !items.length || items.length > 50) return null;
  const merged = new Map();
  for (const item of items) {
    const id = String(item?.id || item?.product || "");
    const count = Number(item?.count);
    if (!isValidObjectId(id) || !Number.isInteger(count) || count < 1 || count > 99) return null;
    merged.set(id, (merged.get(id) || 0) + count);
    if (merged.get(id) > 99) return null;
  }
  return [...merged.entries()].map(([id, count]) => ({ id, count }));
};

const calculateQuote = async ({ items, couponCode = "", userId = null, session = null }) => {
  await connectToDB();
  const normalized = normalizeItems(items);
  if (!normalized) return { error: "Invalid cart items", status: 400 };

  const ids = normalized.map((item) => item.id);
  const products = await ProductModel.find({ _id: { $in: ids }, ...activeProductFilter })
    .select("name sku price stock inventoryTracked img status")
    .session(session)
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const quoteItems = [];
  for (const item of normalized) {
    const product = byId.get(item.id);
    if (!product) return { error: "One or more products are unavailable", status: 409 };
    if (product.inventoryTracked && Number(product.stock || 0) < item.count) {
      return { error: `Insufficient stock for ${product.name}`, status: 409, productId: item.id };
    }
    quoteItems.push({
      id: item.id,
      name: product.name,
      sku: product.sku || "",
      img: product.img || "",
      price: Number(product.price),
      count: item.count,
      inventoryTracked: Boolean(product.inventoryTracked),
      stock: Number(product.stock || 0),
    });
  }

  const subtotal = quoteItems.reduce((sum, item) => sum + item.price * item.count, 0);
  let discount = null;
  const cleanCode = String(couponCode || "").trim().toUpperCase();

  if (cleanCode) {
    discount = await DiscountModel.findOne({ code: cleanCode }).session(session).lean();
    if (!discount || !discount.isActive || discount.uses >= discount.maxUse) {
      return { error: "Discount code is unavailable", status: 422 };
    }
    if (discount.expiresAt && new Date(discount.expiresAt) <= new Date()) {
      return { error: "Discount code is expired", status: 422 };
    }
    if (subtotal < Number(discount.minOrderAmount || 0)) {
      return { error: "Minimum order amount not reached", status: 422 };
    }
    if (userId && discount.perUserLimit) {
      const usedByUser = await OrderModel.countDocuments({
        user: userId,
        discountCode: cleanCode,
        status: { $ne: "CANCELLED" },
      }).session(session);
      if (usedByUser >= discount.perUserLimit) {
        return { error: "Discount per-user limit reached", status: 422 };
      }
    }
  }

  const discountPercent = Number(discount?.percent || 0);
  const discountAmount = Math.floor((subtotal * discountPercent) / 100);
  const shippingCost = subtotal > 0 ? SHIPPING_COST : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  return {
    items: quoteItems,
    subtotal,
    discountCode: discount?.code || "",
    discountPercent,
    discountAmount,
    shippingCost,
    total,
  };
};

export { calculateQuote, normalizeItems, SHIPPING_COST };
