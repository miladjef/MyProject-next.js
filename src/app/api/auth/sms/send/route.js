import crypto from "crypto";
import connectToDB from "@/configs/db";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import { normalizePhone, valiadtePhone } from "@/utils/validation";

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

export async function POST(req) {
  try {
    await connectToDB();
    const { phone, mode = "login" } = await req.json();
    const normalizedPhone = normalizePhone(phone);
    if (!valiadtePhone(normalizedPhone) || !["login", "register"].includes(mode)) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const user = await UserModel.findOne({ phone: normalizedPhone });
    if (mode === "login" && !user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }
    if (mode === "register" && user) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }
    if (await BanModel.findOne({ phone: normalizedPhone })) {
      return Response.json({ message: "Account is blocked" }, { status: 403 });
    }

    const now = Date.now();
    const previous = await OtpModel.findOne({ phone: normalizedPhone });
    if (previous?.lastSentAt && now - previous.lastSentAt < 60_000) {
      return Response.json({ message: "Please wait before requesting another code" }, { status: 429 });
    }

    const requiredEnv = ["OTP_SECRET", "IPPANEL_USER", "IPPANEL_PASS", "IPPANEL_FROM", "IPPANEL_PATTERN_CODE"];
    if (requiredEnv.some((key) => !process.env[key])) {
      return Response.json({ message: "SMS provider is not configured" }, { status: 503 });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const response = await fetch("https://ippanel.com/api/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "pattern",
        user: process.env.IPPANEL_USER,
        pass: process.env.IPPANEL_PASS,
        fromNum: process.env.IPPANEL_FROM,
        toNum: normalizedPhone,
        patternCode: process.env.IPPANEL_PATTERN_CODE,
        inputData: [{ "verification-code": code }],
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      return Response.json({ message: "SMS provider rejected the request" }, { status: 502 });
    }

    await OtpModel.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: { code: hashOtp(normalizedPhone, code), expTime: now + 300_000, times: 0, lastSentAt: now } },
      { upsert: true, new: true }
    );
    return Response.json({ message: "Code sent successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "OTP send failed" }, { status: 500 });
  }
}
