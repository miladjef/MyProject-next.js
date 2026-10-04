import crypto from "crypto";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import DiscountModel from "@/models/Discount";
import OrderModel from "@/models/Order";
import PaymentModel from "@/models/Payment";
import { authUser } from "@/utils/serverHelpers";
import { calculateQuote } from "@/utils/order";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";

const validAddress = (address) => {
  const province = String(address?.province || "").trim();
  const city = String(address?.city || "").trim();
  const postalCode = String(address?.postalCode || "").replace(/\s/g, "");
  const addressLine = String(address?.addressLine || "").trim();
  if (!province || province.length > 120 || !city || city.length > 120) return null;
  if (!/^\d{5,20}$/.test(postalCode)) return null;
  if (!addressLine || addressLine.length > 800) return null;
  return { province, city, postalCode, addressLine };
};

const rollbackStock = async (reserved) => {
  await Promise.all(
    reserved.map((item) => ProductModel.updateOne({ _id: item.id }, { $inc: { stock: item.count } }))
  );
};

export async function POST(req) {
  const reserved = [];
  let consumedDiscount = false;
  let discountCode = "";
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `order-create:${ip}`, limit: 10, windowMs: 15 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const address = validAddress(body.address);
    if (!address) return Response.json({ message: "Invalid address" }, { status: 400 });

    const paymentMethod = ["COD", "MANUAL"].includes(body.paymentMethod) ? body.paymentMethod : "COD";
    const quote = await calculateQuote({ items: body.items, couponCode: body.couponCode, userId: user._id });
    if (quote.error) return Response.json({ message: quote.error }, { status: quote.status || 400 });

    for (const item of quote.items.filter((item) => item.inventoryTracked)) {
      const updated = await ProductModel.findOneAndUpdate(
        { _id: item.id, $or: [{ status: "ACTIVE" }, { status: { $exists: false } }, { status: null }], stock: { $gte: item.count } },
        { $inc: { stock: -item.count } },
        { new: true }
      );
      if (!updated) {
        await rollbackStock(reserved);
        return Response.json({ message: `Insufficient stock for ${item.name}` }, { status: 409 });
      }
      reserved.push({ id: item.id, count: item.count });
    }

    discountCode = quote.discountCode;
    if (discountCode) {
      const consumed = await DiscountModel.findOneAndUpdate(
        {
          code: discountCode,
          isActive: true,
          $expr: { $lt: ["$uses", "$maxUse"] },
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        },
        { $inc: { uses: 1 } },
        { new: true }
      );
      if (!consumed) {
        await rollbackStock(reserved);
        return Response.json({ message: "Discount code is no longer available" }, { status: 409 });
      }
      consumedDiscount = true;
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const order = await OrderModel.create({
      orderNumber,
      user: user._id,
      items: quote.items.map((item) => ({
        product: item.id,
        name: item.name,
        sku: item.sku,
        img: item.img,
        price: item.price,
        count: item.count,
      })),
      address,
      subtotal: quote.subtotal,
      discountCode: quote.discountCode,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      shippingCost: quote.shippingCost,
      total: quote.total,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "UNPAID" : "PENDING",
    });

    try {
      await PaymentModel.create({
        order: order._id,
        user: user._id,
        amount: quote.total,
        method: paymentMethod,
        status: "PENDING",
      });
    } catch (paymentError) {
      await OrderModel.deleteOne({ _id: order._id });
      throw paymentError;
    }

    return Response.json({
      message: "Order created successfully",
      order: { id: String(order._id), orderNumber: order.orderNumber, total: order.total, status: order.status, paymentStatus: order.paymentStatus },
    }, { status: 201 });
  } catch (err) {
    if (reserved.length) await rollbackStock(reserved).catch(() => {});
    if (consumedDiscount && discountCode) {
      await DiscountModel.updateOne({ code: discountCode, uses: { $gt: 0 } }, { $inc: { uses: -1 } }).catch(() => {});
    }
    return Response.json({ message: err.message || "Order creation failed" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const filter = user.role === "ADMIN" && url.searchParams.get("all") === "1" ? {} : { user: user._id };
    const [items, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);
    return Response.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return Response.json({ message: err.message || "Orders fetch failed" }, { status: 500 });
  }
}
