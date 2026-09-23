import connectToDB from "@/configs/db";
import TicketModel from "@/models/Ticket";
import { authUser } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const actor = await authUser();
    if (!actor) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { body, ticketID } = await req.json();
    const cleanBody = String(body || "").trim();
    if (!cleanBody || !isValidObjectId(ticketID)) {
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
    return Response.json({ message: err.message || "Answer creation failed" }, { status: 500 });
  }
}
