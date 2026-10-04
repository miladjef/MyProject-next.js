import crypto from "crypto";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import DiscountModel from "@/models/Discount";
import OrderModel from "@/models/Order";
import PaymentModel from "@/models/Payment";
import { authUser } from "@/utils/serverHelpers";
import { calculateQuote } from "@/utils/order";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { runWithTransaction } from "@/utils/dbTransaction";
import { safeServerError } from "@/utils/apiError";
import { consumeDiscountForUser, releaseDiscountForUser } from "@/utils/discountUsage";

class OrderError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

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

const cleanIdempotencyKey = (req, body) => {
  const value = String(req.headers.get("idempotency-key") || body.idempotencyKey || "").trim();
  return /^[A-Za-z0-9_-]{16,128}$/.test(value) ? value : "";
};

const createOrderCore = async ({ user, body, address, paymentMethod, idempotencyKey, session = null, manualRollback = false }) => {
  const reserved = [];
  let discountConsumed = false;
  let discountCode = "";
  let discountId = null;
  let userDiscountConsumed = false;
  let createdOrderId = null;
  const opts = session ? { session } : {};
  try {
    const existing = await OrderModel.findOne({ user: user._id, idempotencyKey }).session(session).lean();
    if (existing) return { order: existing, reused: true };

    const quote = await calculateQuote({ items: body.items, couponCode: body.couponCode, userId: user._id, session });
    if (quote.error) throw new OrderError(quote.error, quote.status || 400);

    for (const item of quote.items.filter((entry) => entry.inventoryTracked)) {
      const updated = await ProductModel.findOneAndUpdate(
        { _id: item.id, $or: [{ status: "ACTIVE" }, { status: { $exists: false } }, { status: null }], stock: { $gte: item.count } },
        { $inc: { stock: -item.count } },
        { new: true, ...opts }
      );
      if (!updated) throw new OrderError(`Insufficient stock for ${item.name}`, 409);
      reserved.push({ id: item.id, count: item.count });
    }

    discountCode = quote.discountCode;
    if (discountCode) {
      const consumed = await DiscountModel.findOneAndUpdate(
        { code: discountCode, isActive: true, $expr: { $lt: ["$uses", "$maxUse"] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
        { $inc: { uses: 1 } },
        { new: true, ...opts }
      );
      if (!consumed) throw new OrderError("Discount code is no longer available", 409);
      discountConsumed = true;
      discountId = consumed._id;
      userDiscountConsumed = await consumeDiscountForUser({ discount: consumed, userId: user._id, session });
      if (!userDiscountConsumed) throw new OrderError("Discount per-user limit reached", 422);
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const initialPaymentStatus = paymentMethod === "COD" ? "UNPAID" : "PENDING";
    const order = new OrderModel({
      orderNumber,
      idempotencyKey,
      user: user._id,
      recipientName: String(body.recipientName || user.name || "").trim().slice(0, 120),
      recipientPhone: String(body.recipientPhone || user.phone || "").trim().slice(0, 20),
      items: quote.items.map((item) => ({ product: item.id, name: item.name, sku: item.sku, img: item.img, price: item.price, count: item.count })),
      address,
      shippingMethod: ["STANDARD", "EXPRESS", "PICKUP"].includes(body.shippingMethod) ? body.shippingMethod : "STANDARD",
      subtotal: quote.subtotal,
      discountCode: quote.discountCode,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      shippingCost: quote.shippingCost,
      total: quote.total,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      statusHistory: [{ status: "PENDING", paymentStatus: initialPaymentStatus, changedBy: user._id, note: "Order created" }],
    });
    await order.save(opts);
    createdOrderId = order._id;

    const payment = new PaymentModel({ order: order._id, user: user._id, amount: quote.total, method: paymentMethod, status: "PENDING" });
    await payment.save(opts);
    return { order: order.toObject(), reused: false };
  } catch (error) {
    if (manualRollback) {
      if (createdOrderId) await OrderModel.deleteOne({ _id: createdOrderId }).catch(() => {});
      if (reserved.length) await Promise.all(reserved.map((item) => ProductModel.updateOne({ _id: item.id }, { $inc: { stock: item.count } }))).catch(() => {});
      if (userDiscountConsumed && discountId) await releaseDiscountForUser({ discountId, userId: user._id }).catch(() => {});
      if (discountConsumed && discountCode) await DiscountModel.updateOne({ code: discountCode, uses: { $gt: 0 } }, { $inc: { uses: -1 } }).catch(() => {});
    }
    if (error?.code === 11000 && error?.keyPattern?.idempotencyKey) {
      const existing = await OrderModel.findOne({ user: user._id, idempotencyKey }).lean();
      if (existing) return { order: existing, reused: true };
    }
    throw error;
  }
};

export async function POST(req) {
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
    const idempotencyKey = cleanIdempotencyKey(req, body);
    if (!idempotencyKey) return Response.json({ message: "A valid idempotency key is required" }, { status: 400 });
    const paymentMethod = ["COD", "MANUAL"].includes(body.paymentMethod) ? body.paymentMethod : "COD";

    const result = await runWithTransaction(
      (session) => createOrderCore({ user, body, address, paymentMethod, idempotencyKey, session }),
      () => createOrderCore({ user, body, address, paymentMethod, idempotencyKey, manualRollback: true })
    );

    const order = result.order;
    return Response.json({
      message: result.reused ? "Existing order returned" : "Order created successfully",
      reused: result.reused,
      order: { id: String(order._id), orderNumber: order.orderNumber, total: order.total, status: order.status, paymentStatus: order.paymentStatus },
    }, { status: result.reused ? 200 : 201 });
  } catch (err) {
    if (err instanceof OrderError) return Response.json({ message: err.message }, { status: err.status });
    return safeServerError(err, "orders.create");
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
    return safeServerError(err, "orders.list");
  }
}
