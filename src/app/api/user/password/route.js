import { authUser } from "@/utils/serverHelpers";
import { generateAccessToken, hashPassword, verifyPassword } from "@/utils/auth";
import { valiadtePassword } from "@/utils/validation";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";

export async function PATCH(req) {
  const ip = getRequestIp(req);
  const limited = await rateLimit({ key: `password-change:${ip}`, limit: 6, windowMs: 60 * 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

  const user = await authUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const fullUser = await user.constructor.findById(user._id).select("+password +tokenVersion");
  const { currentPassword, newPassword } = await req.json();
  if (!fullUser) return Response.json({ message: "User not found" }, { status: 404 });
  if (fullUser.password && !(await verifyPassword(String(currentPassword || ""), fullUser.password))) {
    return Response.json({ message: "Current password is incorrect" }, { status: 401 });
  }
  if (!valiadtePassword(newPassword)) return Response.json({ message: "Password is not strong enough" }, { status: 400 });
  fullUser.password = await hashPassword(newPassword);
  fullUser.tokenVersion = Number(fullUser.tokenVersion || 0) + 1;
  await fullUser.save();
  const token = generateAccessToken({ userId: String(fullUser._id), role: fullUser.role, tokenVersion: fullUser.tokenVersion });
  const cookie = `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  return Response.json({ message: "Password updated successfully" }, { headers: { "Set-Cookie": cookie } });
}
