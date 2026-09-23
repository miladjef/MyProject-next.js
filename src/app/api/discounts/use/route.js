import connectToDB from "@/configs/db";
import DiscountModel from "@/models/Discount";

export async function PUT(req) {
  try {
    await connectToDB();
    const { code } = await req.json();
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) return Response.json({ message: "Code is required" }, { status: 400 });

    const discount = await DiscountModel.findOneAndUpdate(
      { code: cleanCode, $expr: { $lt: ["$uses", "$maxUse"] } },
      { $inc: { uses: 1 } },
      { new: true }
    );

    if (!discount) {
      const exists = await DiscountModel.exists({ code: cleanCode });
      return Response.json(
        { message: exists ? "Code usage limit" : "Code not found" },
        { status: exists ? 422 : 404 }
      );
    }

    return Response.json({ code: discount.code, percent: discount.percent });
  } catch (err) {
    return Response.json({ message: err.message || "Discount check failed" }, { status: 500 });
  }
}
