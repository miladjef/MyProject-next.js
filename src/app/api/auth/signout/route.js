import { cookies } from "next/headers";
import { authUser } from "@/utils/serverHelpers";

export async function POST() {
  const user = await authUser();
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }

  const cookieStore = await cookies();

  cookieStore.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return Response.json({ message: "Logout is done" });
}
