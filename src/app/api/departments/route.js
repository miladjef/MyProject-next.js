import connectToDB from "@/configs/db";
import DepartmentModel from "@/models/Department";
import { authAdmin } from "@/utils/serverHelpers";

export async function POST(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { title } = await req.json();
    const cleanTitle = String(title || "").trim();
    if (!cleanTitle) return Response.json({ message: "Title is required" }, { status: 400 });
    await DepartmentModel.create({ title: cleanTitle });
    return Response.json({ message: "Department created successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Department creation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDB();
    return Response.json(await DepartmentModel.find({}).sort({ title: 1 }));
  } catch (err) {
    return Response.json({ message: err.message || "Departments fetch failed" }, { status: 500 });
  }
}
