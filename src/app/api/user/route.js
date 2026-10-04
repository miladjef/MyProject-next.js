import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import { authAdmin, authUser } from "@/utils/serverHelpers";
import { normalizeEmail, valiadteEmail } from "@/utils/validation";
import { isValidObjectId } from "mongoose";
import { generateAccessToken, verifyPassword } from "@/utils/auth";
import { serializeSessionCookie } from "@/utils/sessionCookie";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { name, email, currentPassword = "" } = await req.json();
    const cleanName = String(name || "").trim();
    const normalizedEmail = email ? normalizeEmail(email) : "";
    if (!cleanName || cleanName.length > 120) return Response.json({ message: "Invalid profile data" }, { status: 400 });
    if (normalizedEmail && !valiadteEmail(normalizedEmail)) return Response.json({ message: "Invalid email" }, { status: 400 });

    const fullUser = await UserModel.findById(user._id).select("+password +tokenVersion");
    if (!fullUser || fullUser.isDeleted) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const emailChanged = String(fullUser.email || "") !== normalizedEmail;
    if (emailChanged && fullUser.password) {
      if (!currentPassword || !(await verifyPassword(currentPassword, fullUser.password))) {
        return Response.json({ message: "Current password is required to change email" }, { status: 403 });
      }
    }

    if (normalizedEmail) {
      const duplicate = await UserModel.exists({ _id: { $ne: fullUser._id }, email: normalizedEmail, isDeleted: false });
      if (duplicate) return Response.json({ message: "Email is already in use" }, { status: 409 });
    }

    fullUser.name = cleanName;
    fullUser.email = normalizedEmail || undefined;
    if (emailChanged) fullUser.tokenVersion = Number(fullUser.tokenVersion || 0) + 1;
    await fullUser.save();

    const headers = {};
    if (emailChanged) {
      const token = generateAccessToken({ userId: String(fullUser._id), role: fullUser.role, tokenVersion: Number(fullUser.tokenVersion || 0) });
      headers["Set-Cookie"] = serializeSessionCookie(token);
    }
    return Response.json({ message: "User updated successfully" }, { status: 200, headers });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "Profile data already in use" }, { status: 409 });
    return safeServerError(err, "user.update");
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

    const user = await UserModel.findById(id).select("+password +tokenVersion");
    if (!user || user.isDeleted) return Response.json({ message: "User not found" }, { status: 404 });
    user.name = "کاربر حذف شده";
    user.email = undefined;
    user.phone = `del-${String(user._id).slice(-12)}`;
    user.password = undefined;
    user.avatar = "";
    user.role = "USER";
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    return Response.json({ message: "User removed successfully" });
  } catch (err) {
    return safeServerError(err, "user.delete");
  }
}
