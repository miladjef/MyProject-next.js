import connectToDB from "@/configs/db";
import { isValidObjectId } from "mongoose";
import CommentModel from "@/models/Comment";
import ProductModel from "@/models/Product";
import { authAdmin } from "@/utils/serverHelpers";
import { recalculateProductRating } from "@/utils/productRating";

export async function PATCH(req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid comment id" }, { status: 400 });
  const { body, adminReply } = await req.json();
  const comment = await CommentModel.findById(id);
  if (!comment) return Response.json({ message: "Comment not found" }, { status: 404 });
  if (body !== undefined) {
    const value = String(body).trim();
    if (!value || value.length > 5000) return Response.json({ message: "Invalid comment body" }, { status: 400 });
    comment.body = value;
  }
  if (adminReply !== undefined) {
    const value = String(adminReply).trim();
    if (value.length > 3000) return Response.json({ message: "Reply is too long" }, { status: 400 });
    comment.adminReply = value;
  }
  await comment.save();
  return Response.json({ message: "Comment updated" });
}

export async function DELETE(_req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid comment id" }, { status: 400 });
  const comment = await CommentModel.findByIdAndDelete(id);
  if (!comment) return Response.json({ message: "Comment not found" }, { status: 404 });
  await ProductModel.updateOne({ _id: comment.productID }, { $pull: { comments: comment._id } });
  await recalculateProductRating(comment.productID);
  return Response.json({ message: "Comment deleted" });
}
