import connectToDB from "@/configs/db";
import DiscountModel from "@/models/Discount";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { safeServerError } from "@/utils/apiError";

export async function PUT(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `discount-check:${ip}`, limit: 30, windowMs: 15 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    await connectToDB();
    const { code, subtotal = 0 } = await req.json();
    const cleanCode = String(code || "").trim().toUpperCase();
    const numericSubtotal = Number(subtotal) || 0;
    if (!cleanCode) return Response.json({ message: "Code is required" }, { status: 400 });

    const discount = await DiscountModel.findOne({ code: cleanCode }).lean();
    if (!discount) return Response.json({ message: "Code not found" }, { status: 404 });
    if (!discount.isActive || discount.uses >= discount.maxUse) {
      return Response.json({ message: "Code usage limit" }, { status: 422 });
    }
    if (discount.expiresAt && new Date(discount.expiresAt) <= new Date()) {
      return Response.json({ message: "Code expired" }, { status: 422 });
    }
    if (numericSubtotal < Number(discount.minOrderAmount || 0)) {
      return Response.json({ message: "Minimum order amount not reached", minOrderAmount: discount.minOrderAmount }, { status: 422 });
    }

    return Response.json({ code: discount.code, percent: discount.percent, minOrderAmount: discount.minOrderAmount || 0 });
  } catch (err) {
    return safeServerError(err, "api.discounts.use");
  }
}
