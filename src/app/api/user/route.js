import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import { authAdmin, authUser } from "@/utils/serverHelpers";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone } from "@/utils/validation";
import { isValidObjectId } from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { name, email, phone } = await req.json();
    const normalizedEmail = email ? normalizeEmail(email) : "";
    const normalizedPhone = normalizePhone(phone);
    if (!String(name || "").trim() || !valiadtePhone(normalizedPhone)) {
      return Response.json({ message: "Invalid profile data" }, { status: 400 });
    }
    if (normalizedEmail && !valiadteEmail(normalizedEmail)) {
      return Response.json({ message: "Invalid email" }, { status: 400 });
    }

    const duplicate = await UserModel.findOne({
      _id: { $ne: user._id },
      $or: [
        { phone: normalizedPhone },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    });
    if (duplicate) return Response.json({ message: "Profile data already in use" }, { status: 409 });

    user.name = String(name).trim();
    user.email = normalizedEmail || undefined;
    user.phone = normalizedPhone;
    await user.save();

    return Response.json({ message: "User updated successfully" }, { status: 200 });
  } catch (err) {
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
    if (String(admin._id) === String(id)) {
      return Response.json({ message: "You cannot delete your own admin account" }, { status: 409 });
    }

    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) return Response.json({ message: "User not found" }, { status: 404 });
    return Response.json({ message: "User removed successfully" });
  } catch (err) {
    return Response.json({ message: err.message || "Delete failed" }, { status: 500 });
  }
}
