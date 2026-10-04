import connectToDB from "@/configs/db";
import { isValidObjectId } from "mongoose";
import SubDepartmentModel from "@/models/SubDepartment";
import { safeServerError } from "@/utils/apiError";

export async function GET(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid department id" }, { status: 400 });
    return Response.json(await SubDepartmentModel.find({ department: id }).sort({ title: 1 }));
  } catch (err) {
    return safeServerError(err, "api.departments.sub.[id]");
  }
}
