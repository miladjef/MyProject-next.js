import crypto from "crypto";
import connectToDB from "@/configs/db";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import { authUser } from "@/utils/serverHelpers";
import { normalizePhone, valiadtePhone } from "@/utils/validation";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { safeServerError } from "@/utils/apiError";

const getOtpSecret = () => {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32) throw new Error("OTP_SECRET is not configured securely");
  return secret;
};

const hashOtp = (phone, code) =>
  crypto.createHmac("sha256", getOtpSecret()).update(`${phone}:${code}`).digest("hex");

const genericResponse = () => Response.json(
  { message: "If the request is eligible, a verification code will be sent." },
  { status: 202 }
);

export async function POST(req) {
  try {
    await connectToDB();
    const { phone, mode = "login" } = await req.json();
    const normalizedPhone = normalizePhone(phone);
    const validModes = ["login", "register", "reset", "change-phone"];
    if (!valiadtePhone(normalizedPhone) || !validModes.includes(mode)) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const ip = getRequestIp(req);
    const [ipLimit, phoneLimit] = await Promise.all([
      rateLimit({ key: `otp-ip:${ip}`, limit: 12, windowMs: 60 * 60_000 }),
      rateLimit({ key: `otp-phone:${normalizedPhone}`, limit: 5, windowMs: 60 * 60_000 }),
    ]);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);
    if (!phoneLimit.allowed) return rateLimitResponse(phoneLimit.retryAfter);

    const user = await UserModel.findOne({ phone: normalizedPhone, isDeleted: false });
    let currentUser = null;
    let eligible = true;

    if (mode === "change-phone") {
      currentUser = await authUser();
      if (!currentUser) return Response.json({ message: "Unauthorized" }, { status: 401 });
      eligible = !user || String(user._id) === String(currentUser._id);
    } else if (["login", "reset"].includes(mode)) {
      eligible = Boolean(user);
    } else if (mode === "register") {
      eligible = !user;
    }

    if (eligible && await BanModel.exists({ phone: normalizedPhone })) eligible = false;
    if (!eligible) return genericResponse();

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
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("OTP provider rejected request", response.status);
      return genericResponse();
    }

    await OtpModel.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: { code: hashOtp(normalizedPhone, code), expTime: now + 300_000, times: 0, lastSentAt: now, mode } },
      { upsert: true, new: true }
    );
    return genericResponse();
  } catch (err) {
    return safeServerError(err, "auth.otp.send");
  }
}
