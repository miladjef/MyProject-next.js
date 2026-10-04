import connectToDB from "@/configs/db";
import { isValidObjectId } from "mongoose";
import UserModel from "@/models/User";
import { authAdmin } from "@/utils/serverHelpers";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone } from "@/utils/validation";

export async function PATCH(req) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id, name, email, phone } = await req.json();
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid user id" }, { status: 400 });
  const user = await UserModel.findOne({ _id: id, isDeleted: false }).select("+tokenVersion");
  if (!user) return Response.json({ message: "User not found" }, { status: 404 });

  const cleanName = String(name || user.name || "").trim();
  const cleanEmail = email === undefined ? user.email : normalizeEmail(email);
  const cleanPhone = phone === undefined ? user.phone : normalizePhone(phone);
  if (!cleanName || cleanName.length > 120 || !valiadtePhone(cleanPhone) || (cleanEmail && !valiadteEmail(cleanEmail))) {
    return Response.json({ message: "Invalid user data" }, { status: 400 });
  }
  const duplicate = await UserModel.exists({ _id: { $ne: user._id }, isDeleted: false, $or: [{ phone: cleanPhone }, ...(cleanEmail ? [{ email: cleanEmail }] : [])] });
  if (duplicate) return Response.json({ message: "Profile data already in use" }, { status: 409 });
  const identityChanged = String(user.email || "") !== String(cleanEmail || "") || String(user.phone || "") !== String(cleanPhone || "");
  user.name = cleanName;
  user.email = cleanEmail || undefined;
  user.phone = cleanPhone;
  if (identityChanged) user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();
  return Response.json({ message: "User updated successfully" });
}
