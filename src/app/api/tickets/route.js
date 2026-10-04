import connectToDB from "@/configs/db";
import { authUser } from "@/utils/serverHelpers";
import TicketModel from "@/models/Ticket";
import DepartmentModel from "@/models/Department";
import SubDepartmentModel from "@/models/SubDepartment";
import { isValidObjectId } from "mongoose";
import { getRequestIp, rateLimit, rateLimitResponse } from "@/utils/rateLimit";
import { saveUploadedImage } from "@/utils/upload";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    const ip = getRequestIp(req);
    const limited = await rateLimit({ key: `ticket:${ip}`, limit: 20, windowMs: 60 * 60_000 });
    if (!limited.allowed) return rateLimitResponse(limited.retryAfter);
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";
    let payload;
    let file = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      payload = Object.fromEntries(["title", "body", "department", "subDepartment", "priority"].map((key) => [key, form.get(key)]));
      file = form.get("attachment");
    } else {
      payload = await req.json();
    }

    const { title, body, department, subDepartment, priority } = payload;
    const cleanTitle = String(title || "").trim();
    const cleanBody = String(body || "").trim();
    const numericPriority = Number(priority);
    if (!cleanTitle || cleanTitle.length > 180 || !cleanBody || cleanBody.length > 10000 || !isValidObjectId(department) || !isValidObjectId(subDepartment) || ![1, 2, 3].includes(numericPriority)) {
      return Response.json({ message: "Invalid ticket data" }, { status: 400 });
    }

    const [departmentExists, subDepartmentExists] = await Promise.all([
      DepartmentModel.exists({ _id: department }),
      SubDepartmentModel.exists({ _id: subDepartment, department }),
    ]);
    if (!departmentExists || !subDepartmentExists) return Response.json({ message: "Department not found" }, { status: 404 });

    let attachment = "";
    if (file && typeof file.arrayBuffer === "function" && file.size) {
      attachment = await saveUploadedImage(file, { folder: "tickets", maxBytes: 6 * 1024 * 1024 });
    }

    await TicketModel.create({ title: cleanTitle, body: cleanBody, department, subDepartment, priority: numericPriority, user: user._id, attachment });
    return Response.json({ message: "Ticket saved successfully" }, { status: 201 });
  } catch (err) {
    if (/image/i.test(err?.message || "")) return Response.json({ message: "Invalid attachment" }, { status: 400 });
    return safeServerError(err, "tickets.create");
  }
}
