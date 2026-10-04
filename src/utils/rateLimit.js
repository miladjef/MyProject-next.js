import RateLimitModel from "@/models/RateLimit";
import connectToDB from "@/configs/db";

const getRequestIp = (req) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
};

const atomicIncrement = async ({ key, windowMs, now }) => {
  const resetAt = new Date(now.getTime() + windowMs);
  return RateLimitModel.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          key,
          count: {
            $cond: [
              { $and: [{ $ne: ["$resetAt", null] }, { $gt: ["$resetAt", now] }] },
              { $add: [{ $ifNull: ["$count", 0] }, 1] },
              1,
            ],
          },
          resetAt: {
            $cond: [
              { $and: [{ $ne: ["$resetAt", null] }, { $gt: ["$resetAt", now] }] },
              "$resetAt",
              resetAt,
            ],
          },
          updatedAt: now,
        },
      },
      { $set: { createdAt: { $ifNull: ["$createdAt", now] } } },
    ],
    { upsert: true, new: true }
  );
};

const rateLimit = async ({ key, limit, windowMs }) => {
  await connectToDB();
  const now = new Date();
  let entry;
  try {
    entry = await atomicIncrement({ key, windowMs, now });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    entry = await atomicIncrement({ key, windowMs, now });
  }

  const allowed = Boolean(entry && entry.count <= limit);
  const retryAfter = entry
    ? Math.max(1, Math.ceil((entry.resetAt.getTime() - Date.now()) / 1000))
    : Math.ceil(windowMs / 1000);
  return { allowed, retryAfter, remaining: Math.max(0, limit - Number(entry?.count || 0)) };
};

const rateLimitResponse = (retryAfter) =>
  Response.json(
    { message: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );

export { getRequestIp, rateLimit, rateLimitResponse };
