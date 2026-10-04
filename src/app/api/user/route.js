import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import { authAdmin, authUser } from "@/utils/serverHelpers";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone } from "@/utils/validation";
import { isValidObjectId } from "mongoose";
import { generateAccessToken } from "@/utils/auth";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { name, email, phone } = await req.json();
    const cleanName = String(name || "").trim();
    const normalizedEmail = email ? normalizeEmail(email) : "";
    const normalizedPhone = normalizePhone(phone);
    if (!cleanName || cleanName.length > 120 || !valiadtePhone(normalizedPhone)) {
      return Response.json({ message: "Invalid profile data" }, { status: 400 });
    }
    if (normalizedEmail && !valiadteEmail(normalizedEmail)) {
      return Response.json({ message: "Invalid email" }, { status: 400 });
    }

    const duplicate = await UserModel.findOne({
      _id: { $ne: user._id },
      isDeleted: false,
      $or: [{ phone: normalizedPhone }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])],
    });
    if (duplicate) return Response.json({ message: "Profile data already in use" }, { status: 409 });

    const identityChanged = String(user.email || "") !== normalizedEmail || String(user.phone || "") !== normalizedPhone;
    user.name = cleanName;
    user.email = normalizedEmail || undefined;
    user.phone = normalizedPhone;
    if (identityChanged) user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();

    const headers = {};
    if (identityChanged) {
      const token = generateAccessToken({ userId: String(user._id), role: user.role, tokenVersion: Number(user.tokenVersion || 0) });
      headers["Set-Cookie"] = `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    }
    return Response.json({ message: "User updated successfully" }, { status: 200, headers });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "Profile data already in use" }, { status: 409 });
    return Response.json({ message: err.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid user id" }, { status: 400 });
    if (String(admin._id) === String(id)) return Response.json({ message: "You cannot delete your own admin account" }, { status: 409 });

    const user = await UserModel.findById(id).select("+password");
    if (!user || user.isDeleted) return Response.json({ message: "User not found" }, { status: 404 });
    user.name = "کاربر حذف شده";
    user.email = undefined;
    user.phone = `del-${String(user._id).slice(-12)}`;
    user.password = undefined;
    user.avatar = "";
    user.role = "USER";
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    return Response.json({ message: "User removed successfully" });
  } catch (err) {
    return Response.json({ message: err.message || "Delete failed" }, { status: 500 });
  }
}
