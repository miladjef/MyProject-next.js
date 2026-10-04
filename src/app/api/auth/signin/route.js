import { generateAccessToken, verifyPassword } from "@/utils/auth";
import {
  normalizeEmail,
  normalizePhone,
  valiadteEmail,
  valiadtePhone,
} from "@/utils/validation";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import connectToDB from "@/configs/db";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { serializeSessionCookie } from "@/utils/sessionCookie";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `signin:${ip}`, limit: 12, windowMs: 15 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    await connectToDB();
    const { email, identifier, password } = await req.json();
    const rawIdentifier = String(identifier || email || "").trim();
    if (!rawIdentifier || typeof password !== "string" || !password) {
      return Response.json({ message: "Invalid credentials" }, { status: 400 });
    }

    let query;
    if (valiadteEmail(rawIdentifier)) query = { email: normalizeEmail(rawIdentifier) };
    else if (valiadtePhone(rawIdentifier)) query = { phone: normalizePhone(rawIdentifier) };
    else return Response.json({ message: "Invalid credentials" }, { status: 400 });

    const user = await UserModel.findOne(query).select("+password +tokenVersion");
    if (!user?.password) return Response.json({ message: "Invalid credentials" }, { status: 401 });

    const banned = await BanModel.exists({
      $or: [
        ...(user.email ? [{ email: user.email }] : []),
        ...(user.phone ? [{ phone: user.phone }] : []),
      ],
    });
    if (banned) return Response.json({ message: "Invalid credentials" }, { status: 401 });

    if (!(await verifyPassword(password, user.password))) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = generateAccessToken({ userId: String(user._id), role: user.role, tokenVersion: Number(user.tokenVersion || 0) });
    return Response.json(
      { message: "User logged in successfully" },
      { status: 200, headers: { "Set-Cookie": serializeSessionCookie(accessToken) } }
    );
  } catch (err) {
    return safeServerError(err, "auth.signin");
  }
}
