import connectToDB from "@/configs/db";
import DiscountModel from "@/models/Discount";
import { authAdmin } from "@/utils/serverHelpers";

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { code, percent, maxUse, minOrderAmount = 0, expiresAt = null, perUserLimit = 1 } = await req.json();
    const cleanCode = String(code || "").trim().toUpperCase();
    const numericPercent = Number(percent);
    const numericMaxUse = Number(maxUse);
    const numericMin = Number(minOrderAmount || 0);
    const numericPerUser = Number(perUserLimit || 1);
    const expiry = expiresAt ? new Date(expiresAt) : null;
    if (!cleanCode || cleanCode.length > 64 || !Number.isFinite(numericPercent) || numericPercent <= 0 || numericPercent > 100 || !Number.isInteger(numericMaxUse) || numericMaxUse < 1 || !Number.isFinite(numericMin) || numericMin < 0 || !Number.isInteger(numericPerUser) || numericPerUser < 1 || (expiry && Number.isNaN(expiry.getTime()))) {
      return Response.json({ message: "Invalid discount data" }, { status: 400 });
    }
    if (await DiscountModel.exists({ code: cleanCode })) return Response.json({ message: "Discount already exists" }, { status: 409 });
    await DiscountModel.create({ code: cleanCode, percent: numericPercent, maxUse: numericMaxUse, minOrderAmount: numericMin, expiresAt: expiry, perUserLimit: numericPerUser });
    return Response.json({ message: "Discount code created successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Discount creation failed" }, { status: 500 });
  }
}

export async function GET(req) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const [items, total] = await Promise.all([
    DiscountModel.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DiscountModel.countDocuments({}),
  ]);
  return Response.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}
