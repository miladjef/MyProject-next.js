import crypto from "crypto";
import connectToDB from "@/configs/db";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import { authUser } from "@/utils/serverHelpers";
import { generateAccessToken, hashPassword } from "@/utils/auth";
import { normalizeEmail, normalizePhone, valiadteEmail, valiadtePhone, valiadtePassword } from "@/utils/validation";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { serializeSessionCookie } from "@/utils/sessionCookie";
import { safeServerError } from "@/utils/apiError";

const getOtpSecret = () => {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32) throw new Error("OTP_SECRET is not configured securely");
  return secret;
};

const hashOtp = (phone, code) =>
  crypto.createHmac("sha256", getOtpSecret()).update(`${phone}:${code}`).digest("hex");

const matchesOtp = (phone, code, storedHash) => {
  const actual = Buffer.from(hashOtp(phone, code), "hex");
  const expected = Buffer.from(String(storedHash || ""), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export async function POST(req) {
  try {
    await connectToDB();
    const { phone, code, mode = "login", name = "", email = "", password = "", newPassword = "" } = await req.json();
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email ? normalizeEmail(email) : "";
    const validModes = ["login", "register", "reset", "change-phone"];
    if (!valiadtePhone(normalizedPhone) || !/^\d{6}$/.test(String(code || "")) || !validModes.includes(mode)) {
      return Response.json({ message: "Invalid code" }, { status: 400 });
    }

    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `otp-verify:${ip}`, limit: 20, windowMs: 15 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    if (mode === "register" && (!String(name).trim() || String(name).trim().length > 120 || (normalizedEmail && !valiadteEmail(normalizedEmail)) || (password && !valiadtePassword(password)))) {
      return Response.json({ message: "Invalid registration data" }, { status: 400 });
    }
    if (mode === "reset" && !valiadtePassword(newPassword)) {
      return Response.json({ message: "Password is not strong enough" }, { status: 400 });
    }

    const otp = await OtpModel.findOne({ phone: normalizedPhone, mode });
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

    if (mode === "change-phone") {
      const currentUser = await authUser();
      if (!currentUser) return Response.json({ message: "Unauthorized" }, { status: 401 });
      const duplicate = await UserModel.exists({ phone: normalizedPhone, _id: { $ne: currentUser._id }, isDeleted: false });
      if (duplicate) return Response.json({ message: "Phone is already in use" }, { status: 409 });
      if (await BanModel.exists({ phone: normalizedPhone })) return Response.json({ message: "Phone is blocked" }, { status: 403 });

      currentUser.phone = normalizedPhone;
      currentUser.tokenVersion = Number(currentUser.tokenVersion || 0) + 1;
      await currentUser.save();
      await OtpModel.deleteOne({ _id: otp._id });
      const accessToken = generateAccessToken({ userId: String(currentUser._id), role: currentUser.role, tokenVersion: Number(currentUser.tokenVersion || 0) });
      return Response.json({ message: "Phone updated successfully" }, { headers: { "Set-Cookie": serializeSessionCookie(accessToken) } });
    }

    let user = await UserModel.findOne({ phone: normalizedPhone, isDeleted: false }).select("+password +tokenVersion");
    if (["login", "reset"].includes(mode) && !user) {
      await OtpModel.deleteOne({ _id: otp._id });
      return Response.json({ message: "Code is not correct" }, { status: 409 });
    }
    if (user && await BanModel.exists({ phone: normalizedPhone })) return Response.json({ message: "Account is blocked" }, { status: 403 });

    if (mode === "register") {
      if (user) return Response.json({ message: "Registration is not available" }, { status: 409 });
      if (normalizedEmail && (await UserModel.exists({ email: normalizedEmail, isDeleted: false }))) {
        return Response.json({ message: "Registration is not available" }, { status: 409 });
      }
      user = await UserModel.create({
        phone: normalizedPhone,
        name: String(name).trim(),
        email: normalizedEmail || undefined,
        password: password ? await hashPassword(password) : undefined,
        role: "USER",
      });
    }

    if (mode === "reset") {
      user.password = await hashPassword(newPassword);
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
      await user.save();
    }

    await OtpModel.deleteOne({ _id: otp._id });
    const accessToken = generateAccessToken({ userId: String(user._id), role: user.role, tokenVersion: Number(user.tokenVersion || 0) });
    return Response.json(
      { message: mode === "reset" ? "Password reset successfully" : "Code is correct" },
      { status: 200, headers: { "Set-Cookie": serializeSessionCookie(accessToken) } }
    );
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "Request could not be completed" }, { status: 409 });
    return safeServerError(err, "auth.otp.verify");
  }
}
