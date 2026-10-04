import connectToDB from "@/configs/db";
import { isValidObjectId } from "mongoose";
import DiscountModel from "@/models/Discount";
import { authAdmin } from "@/utils/serverHelpers";

export async function PATCH(req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid discount id" }, { status: 400 });
  const body = await req.json();
  const discount = await DiscountModel.findById(id);
  if (!discount) return Response.json({ message: "Discount not found" }, { status: 404 });
  if (body.percent !== undefined) discount.percent = Number(body.percent);
  if (body.maxUse !== undefined) discount.maxUse = Number(body.maxUse);
  if (body.minOrderAmount !== undefined) discount.minOrderAmount = Number(body.minOrderAmount);
  if (body.perUserLimit !== undefined) discount.perUserLimit = Number(body.perUserLimit);
  if (body.isActive !== undefined) discount.isActive = Boolean(body.isActive);
  if (body.expiresAt !== undefined) discount.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  await discount.save();
  return Response.json({ message: "Discount updated successfully" });
}

export async function DELETE(_req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid discount id" }, { status: 400 });
  const deleted = await DiscountModel.findByIdAndDelete(id);
  if (!deleted) return Response.json({ message: "Discount not found" }, { status: 404 });
  return Response.json({ message: "Discount deleted successfully" });
}
