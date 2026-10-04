import connectToDB from "@/configs/db";
import TicketModel from "@/models/Ticket";
import { authUser } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `ticket-answer:${ip}`, limit: 30, windowMs: 60 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);
    await connectToDB();
    const actor = await authUser();
    if (!actor) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { body, ticketID } = await req.json();
    const cleanBody = String(body || "").trim();
    if (!cleanBody || cleanBody.length > 10000 || !isValidObjectId(ticketID)) {
      return Response.json({ message: "Invalid answer data" }, { status: 400 });
    }

    const mainTicket = await TicketModel.findOne({ _id: ticketID, isAnswer: false });
    if (!mainTicket) return Response.json({ message: "Ticket not found" }, { status: 404 });

    const isOwner = String(mainTicket.user) === String(actor._id);
    const isAdmin = actor.role === "ADMIN";
    if (!isAdmin && !isOwner) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    await TicketModel.create({
      title: mainTicket.title,
      body: cleanBody,
      department: mainTicket.department,
      subDepartment: mainTicket.subDepartment,
      priority: mainTicket.priority,
      user: actor._id,
      hasAnswer: false,
      isAnswer: true,
      mainTicket: mainTicket._id,
    });

    if (isAdmin) {
      mainTicket.hasAnswer = true;
      await mainTicket.save();
    }

    return Response.json({ message: "Answer saved successfully" }, { status: 201 });
  } catch (err) {
    return safeServerError(err, "api.tickets.answer");
  }
}
