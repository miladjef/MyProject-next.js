import RateLimitModel from "@/models/RateLimit";
import connectToDB from "@/configs/db";

const getRequestIp = (req) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
};

const rateLimit = async ({ key, limit, windowMs }) => {
  await connectToDB();
  const now = new Date();
  let entry = await RateLimitModel.findOne({ key });

  if (!entry || entry.resetAt <= now) {
    if (entry) {
      entry.count = 1;
      entry.resetAt = new Date(Date.now() + windowMs);
      await entry.save();
    } else {
      try {
        entry = await RateLimitModel.create({
          key,
          count: 1,
          resetAt: new Date(Date.now() + windowMs),
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        entry = await RateLimitModel.findOneAndUpdate(
          { key },
          { $inc: { count: 1 } },
          { new: true }
        );
      }
    }
  } else {
    entry = await RateLimitModel.findOneAndUpdate(
      { key, resetAt: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true }
    );
  }

  const allowed = Boolean(entry && entry.count <= limit);
  const retryAfter = entry
    ? Math.max(1, Math.ceil((entry.resetAt.getTime() - Date.now()) / 1000))
    : Math.ceil(windowMs / 1000);

  return { allowed, retryAfter };
};

const rateLimitResponse = (retryAfter) =>
  Response.json(
    { message: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );

export { getRequestIp, rateLimit, rateLimitResponse };
