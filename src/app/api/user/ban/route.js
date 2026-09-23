import connectToDB from "@/configs/db";
import BanModel from "@/models/Ban";
import UserModel from "@/models/User";
import { authAdmin } from "@/utils/serverHelpers";
import { normalizeEmail, normalizePhone } from "@/utils/validation";

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { email, phone } = await req.json();
    const normalizedEmail = email ? normalizeEmail(email) : "";
    const normalizedPhone = phone ? normalizePhone(phone) : "";
    if (!normalizedEmail && !normalizedPhone) {
      return Response.json({ message: "Email or phone is required" }, { status: 400 });
    }

    const target = await UserModel.findOne({
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });
    if (target && String(target._id) === String(admin._id)) {
      return Response.json({ message: "You cannot ban your own account" }, { status: 409 });
    }

    await BanModel.findOneAndUpdate(
      {
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
      { $set: { email: normalizedEmail || undefined, phone: normalizedPhone || undefined } },
      { upsert: true, new: true }
    );

    return Response.json({ message: "User banned successfully" });
  } catch (err) {
    return Response.json({ message: err.message || "Ban failed" }, { status: 500 });
  }
}
