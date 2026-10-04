import { cookies } from "next/headers";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import connectToDB from "@/configs/db";
import { verifyAccessToken } from "./auth";
import { getSessionCookieName } from "./sessionCookie";

const authUser = async () => {
  await connectToDB();
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const tokenPayload = verifyAccessToken(token);
  if (!tokenPayload) return null;

  const user = tokenPayload.userId || tokenPayload.sub
    ? await UserModel.findById(tokenPayload.userId || tokenPayload.sub).select("+tokenVersion")
    : tokenPayload.email
      ? await UserModel.findOne({ email: tokenPayload.email }).select("+tokenVersion")
      : null;

  if (!user || user.isDeleted) return null;
  if (Number(tokenPayload.tokenVersion || 0) !== Number(user.tokenVersion || 0)) return null;

  const blocked = await BanModel.exists({
    $or: [
      ...(user.email ? [{ email: user.email }] : []),
      ...(user.phone ? [{ phone: user.phone }] : []),
    ],
  });

  return blocked ? null : user;
};

const authAdmin = async () => {
  const user = await authUser();
  return user?.role === "ADMIN" ? user : null;
};

export { authUser, authAdmin };
