import { authUser } from "@/utils/serverHelpers";

export async function GET() {
  const user = await authUser();
  if (!user) {
    return Response.json({ data: null, message: "Unauthorized" }, { status: 401 });
  }

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.refreshToken;
  delete safeUser.__v;
  return Response.json(safeUser);
}
