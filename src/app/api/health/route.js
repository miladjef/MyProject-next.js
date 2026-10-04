import mongoose from "mongoose";
import connectToDB from "@/configs/db";

export async function GET() {
  const startedAt = Date.now();
  try {
    await connectToDB();
    await mongoose.connection.db.admin().ping();
    return Response.json({ status: "ok", database: "up", latencyMs: Date.now() - startedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", database: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
