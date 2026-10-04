import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import { authAdmin } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";
import { safeServerError } from "@/utils/apiError";

export async function PUT(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid user id" }, { status: 400 });
    if (String(admin._id) === String(id)) {
      return Response.json({ message: "You cannot change your own role" }, { status: 409 });
    }

    const user = await UserModel.findById(id).select("+tokenVersion");
    if (!user) return Response.json({ message: "User not found" }, { status: 404 });
    user.role = user.role === "USER" ? "ADMIN" : "USER";
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    return Response.json({ message: "User role updated successfully" });
  } catch (err) {
    return safeServerError(err, "api.user.role");
  }
}
