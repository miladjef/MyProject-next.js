import connectToDB from "@/configs/db";
import DiscountModel from "@/models/Discount";
import { authAdmin } from "@/utils/serverHelpers";

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { code, percent, maxUse } = await req.json();
    const cleanCode = String(code || "").trim().toUpperCase();
    const numericPercent = Number(percent);
    const numericMaxUse = Number(maxUse);
    if (!cleanCode || !Number.isFinite(numericPercent) || numericPercent <= 0 || numericPercent > 100 || !Number.isInteger(numericMaxUse) || numericMaxUse < 1) {
      return Response.json({ message: "Invalid discount data" }, { status: 400 });
    }
    if (await DiscountModel.exists({ code: cleanCode })) {
      return Response.json({ message: "Discount already exists" }, { status: 409 });
    }

    await DiscountModel.create({ code: cleanCode, percent: numericPercent, maxUse: numericMaxUse });
    return Response.json({ message: "Discount code created successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Discount creation failed" }, { status: 500 });
  }
}
