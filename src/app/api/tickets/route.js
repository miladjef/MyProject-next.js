import connectToDB from "@/configs/db";
import { authUser } from "@/utils/serverHelpers";
import TicketModel from "@/models/Ticket";
import DepartmentModel from "@/models/Department";
import SubDepartmentModel from "@/models/SubDepartment";
import { isValidObjectId } from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { title, body, department, subDepartment, priority } = await req.json();
    const cleanTitle = String(title || "").trim();
    const cleanBody = String(body || "").trim();
    const numericPriority = Number(priority);
    if (!cleanTitle || !cleanBody || !isValidObjectId(department) || !isValidObjectId(subDepartment) || ![1, 2, 3].includes(numericPriority)) {
      return Response.json({ message: "Invalid ticket data" }, { status: 400 });
    }

    const [departmentExists, subDepartmentExists] = await Promise.all([
      DepartmentModel.exists({ _id: department }),
      SubDepartmentModel.exists({ _id: subDepartment, department }),
    ]);
    if (!departmentExists || !subDepartmentExists) {
      return Response.json({ message: "Department not found" }, { status: 404 });
    }

    await TicketModel.create({
      title: cleanTitle,
      body: cleanBody,
      department,
      subDepartment,
      priority: numericPriority,
      user: user._id,
    });

    return Response.json({ message: "Ticket saved successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Ticket creation failed" }, { status: 500 });
  }
}
