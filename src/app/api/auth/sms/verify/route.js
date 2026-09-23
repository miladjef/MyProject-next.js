import crypto from "crypto";
import connectToDB from "@/configs/db";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import { generateAccessToken } from "@/utils/auth";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone } from "@/utils/validation";
import { roles } from "@/utils/constants";

const getOtpSecret = () => {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("OTP_SECRET is not configured");
  return secret;
};

const hashOtp = (phone, code) =>
  crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${phone}:${code}`)
    .digest("hex");

const matchesOtp = (phone, code, storedHash) => {
  const actual = Buffer.from(hashOtp(phone, code), "hex");
  const expected = Buffer.from(String(storedHash || ""), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const cookie = (token) =>
  `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

export async function POST(req) {
  try {
    await connectToDB();
    const { phone, code, mode = "login", name = "", email = "" } = await req.json();
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email ? normalizeEmail(email) : "";
    if (!valiadtePhone(normalizedPhone) || !/^\d{6}$/.test(String(code || "")) || !["login", "register"].includes(mode)) {
      return Response.json({ message: "Invalid code" }, { status: 400 });
    }
    if (mode === "register" && (!String(name).trim() || (normalizedEmail && !valiadteEmail(normalizedEmail)))) {
      return Response.json({ message: "Invalid registration data" }, { status: 400 });
    }
    if (await BanModel.findOne({ phone: normalizedPhone })) {
      return Response.json({ message: "Account is blocked" }, { status: 403 });
    }

    const otp = await OtpModel.findOne({ phone: normalizedPhone });
    if (!otp) return Response.json({ message: "Code is not correct" }, { status: 409 });
    if (otp.expTime <= Date.now()) {
      await OtpModel.deleteOne({ _id: otp._id });
      return Response.json({ message: "Code is expired" }, { status: 410 });
    }
    if (otp.times >= 5) {
      await OtpModel.deleteOne({ _id: otp._id });
      return Response.json({ message: "Too many attempts" }, { status: 429 });
    }
    if (!matchesOtp(normalizedPhone, String(code), otp.code)) {
      await OtpModel.updateOne({ _id: otp._id }, { $inc: { times: 1 } });
      return Response.json({ message: "Code is not correct" }, { status: 409 });
    }

    let user = await UserModel.findOne({ phone: normalizedPhone });
    if (mode === "login" && !user) {
      await OtpModel.deleteOne({ _id: otp._id });
      return Response.json({ message: "User not found" }, { status: 404 });
    }
    if (mode === "register") {
      if (user) return Response.json({ message: "User already exists" }, { status: 409 });
      if (normalizedEmail && await UserModel.exists({ email: normalizedEmail })) {
        return Response.json({ message: "Email already exists" }, { status: 409 });
      }
      const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL || "");
      const role = adminEmail && normalizedEmail === adminEmail ? roles.ADMIN : roles.USER;
      user = await UserModel.create({
        phone: normalizedPhone,
        name: String(name).trim(),
        email: normalizedEmail || undefined,
        role,
      });
    }

    await OtpModel.deleteOne({ _id: otp._id });
    const accessToken = generateAccessToken({ userId: String(user._id), email: user.email, role: user.role });
    return Response.json({ message: "Code is correct" }, { status: 200, headers: { "Set-Cookie": cookie(accessToken) } });
  } catch (err) {
    if (err?.code === 11000) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }
    return Response.json({ message: err.message || "OTP verification failed" }, { status: 500 });
  }
}
