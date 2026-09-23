import connectToDB from "@/configs/db";
import CommentModel from "@/models/Comment";
import { authAdmin } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";

export async function PUT(req) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await req.json();
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid comment id" }, { status: 400 });
    const comment = await CommentModel.findByIdAndUpdate(id, { $set: { isAccept: false } });
    if (!comment) return Response.json({ message: "Comment not found" }, { status: 404 });
    return Response.json({ message: "Comment rejected successfully" });
  } catch (err) {
    return Response.json({ message: err.message || "Comment update failed" }, { status: 500 });
  }
}
