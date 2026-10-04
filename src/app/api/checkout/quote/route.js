import { calculateQuote } from "@/utils/order";
import { authUser } from "@/utils/serverHelpers";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `quote:${ip}`, limit: 60, windowMs: 15 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    const { items, couponCode = "" } = await req.json();
    const user = await authUser();
    const quote = await calculateQuote({ items, couponCode, userId: user?._id || null });
    if (quote.error) return Response.json({ message: quote.error, productId: quote.productId }, { status: quote.status || 400 });

    return Response.json(quote);
  } catch (err) {
    return safeServerError(err, "api.checkout.quote");
  }
}
