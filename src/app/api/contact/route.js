import { NextResponse } from "next/server";
import connectToDB from "@/configs/db";
import ContactModel from "@/models/Contact";
import { normalizePhone, valiadteEmail, valiadtePhone } from "@/utils/validation";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";

export async function POST(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `contact:${ip}`, limit: 8, windowMs: 60 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

    await connectToDB();
    const { name = "", email = "", phone = "", company = "", message = "" } = await req.json();
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);
    const cleanCompany = String(company).trim();
    const cleanMessage = String(message).trim();

    if (!cleanName || cleanName.length > 120 || !valiadteEmail(cleanEmail) || !valiadtePhone(cleanPhone) || !cleanMessage || cleanMessage.length > 5000 || cleanCompany.length > 160) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    await ContactModel.create({ name: cleanName, email: cleanEmail, phone: cleanPhone, company: cleanCompany, message: cleanMessage });
    return NextResponse.json({ message: "Message saved" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
