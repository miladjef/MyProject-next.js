import { clearSessionCookie } from "@/utils/sessionCookie";

export async function POST() {
  return Response.json(
    { message: "Logout is done" },
    { headers: { "Set-Cookie": clearSessionCookie() } }
  );
}
