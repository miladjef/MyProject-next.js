import { NextResponse } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request) {
  const response = NextResponse.next();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  if (request.nextUrl.pathname.startsWith("/api/") && unsafeMethods.has(request.method)) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    const maxBytes = request.nextUrl.pathname.startsWith("/api/products") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (contentLength > maxBytes) return NextResponse.json({ message: "Request body is too large" }, { status: 413 });
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite === "cross-site") {
      return NextResponse.json({ message: "Cross-site request blocked" }, { status: 403 });
    }

    const origin = request.headers.get("origin");
    if (origin) {
      let allowed = false;
      try {
        const originUrl = new URL(origin);
        const allowedOrigins = new Set([request.nextUrl.origin]);
        if (process.env.SITE_URL) allowedOrigins.add(new URL(process.env.SITE_URL).origin);
        allowed = allowedOrigins.has(originUrl.origin);
      } catch {
        allowed = false;
      }
      if (!allowed) return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
    }
  }

  return response;
}

export const config = { matcher: ["/api/:path*"] };
