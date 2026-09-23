import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import { generateAccessToken, hashPassword } from "@/utils/auth";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone, valiadtePassword } from "@/utils/validation";
import { roles } from "@/utils/constants";

const cookie = (token) =>
  `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

export async function POST(req) {
  try {
    await connectToDB();
    const { name, phone, email, password } = await req.json();
    const normalizedEmail = email ? normalizeEmail(email) : "";
    const normalizedPhone = normalizePhone(phone);

    if (!String(name || "").trim() || !valiadtePhone(normalizedPhone)) {
      return Response.json({ message: "Invalid registration data" }, { status: 400 });
    }
    if (normalizedEmail && !valiadteEmail(normalizedEmail)) {
      return Response.json({ message: "Invalid email" }, { status: 400 });
    }
    if (!valiadtePassword(password)) {
      return Response.json({ message: "Password is not strong enough" }, { status: 400 });
    }

    const banned = await BanModel.findOne({
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        { phone: normalizedPhone },
      ],
    });
    if (banned) {
      return Response.json({ message: "Account is blocked" }, { status: 403 });
    }

    const duplicateFilters = [{ phone: normalizedPhone }];
    if (normalizedEmail) duplicateFilters.push({ email: normalizedEmail });
    const existingUser = await UserModel.findOne({ $or: duplicateFilters });
    if (existingUser) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }

    const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL || "");
    const role = adminEmail && normalizedEmail === adminEmail ? roles.ADMIN : roles.USER;

    const user = await UserModel.create({
      name: String(name).trim(),
      email: normalizedEmail || undefined,
      phone: normalizedPhone,
      password: await hashPassword(password),
      role,
    });

    const accessToken = generateAccessToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    return Response.json(
      { message: "User signed up successfully" },
      { status: 201, headers: { "Set-Cookie": cookie(accessToken) } }
    );
  } catch (err) {
    if (err?.code === 11000) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }
    return Response.json({ message: err.message || "Registration failed" }, { status: 500 });
  }
}
