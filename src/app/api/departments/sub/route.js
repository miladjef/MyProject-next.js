import connectToDB from "@/configs/db";
import SubDepartmentModel from "@/models/SubDepartment";
import DepartmentModel from "@/models/Department";
import { authAdmin } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { title, department } = await req.json();
    const cleanTitle = String(title || "").trim();
    if (!cleanTitle || !isValidObjectId(department)) return Response.json({ message: "Invalid sub-department data" }, { status: 400 });
    if (!(await DepartmentModel.exists({ _id: department }))) return Response.json({ message: "Department not found" }, { status: 404 });
    await SubDepartmentModel.create({ title: cleanTitle, department });
    return Response.json({ message: "SubDepartment created successfully" }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) return Response.json({ message: "SubDepartment already exists" }, { status: 409 });
    return safeServerError(err, "api.departments.sub");
  }
}
