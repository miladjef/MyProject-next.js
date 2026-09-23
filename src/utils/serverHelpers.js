import { cookies } from "next/headers";
import UserModel from "@/models/User";
import connectToDB from "@/configs/db";
import { verifyAccessToken } from "./auth";

const authUser = async () => {
  await connectToDB();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const tokenPayload = verifyAccessToken(token);
  if (!tokenPayload) return null;

  if (tokenPayload.userId || tokenPayload.sub) {
    return UserModel.findById(tokenPayload.userId || tokenPayload.sub);
  }

  // Backward compatibility for tokens issued by older releases.
  if (tokenPayload.email) {
    return UserModel.findOne({ email: tokenPayload.email });
  }

  return null;
};

const authAdmin = async () => {
  const user = await authUser();
  return user?.role === "ADMIN" ? user : null;
};

export { authUser, authAdmin };
