import connectToDB from "@/configs/db";
import CommentModel from "@/models/Comment";
import ProductModel from "@/models/Product";
import { isValidObjectId } from "mongoose";
import { valiadteEmail, normalizeEmail } from "@/utils/validation";
import { authUser } from "@/utils/serverHelpers";

export async function POST(req) {
  try {
    await connectToDB();
    const { username, body, email, score, productID } = await req.json();
    const cleanUsername = String(username || "").trim();
    const cleanBody = String(body || "").trim();
    const cleanEmail = normalizeEmail(email);
    const numericScore = Number(score);
    if (!cleanUsername || !cleanBody || !valiadteEmail(cleanEmail) || !isValidObjectId(productID) || !Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
      return Response.json({ message: "Invalid comment data" }, { status: 400 });
    }
    if (!(await ProductModel.exists({ _id: productID }))) return Response.json({ message: "Product not found" }, { status: 404 });

    const actor = await authUser();
    const comment = await CommentModel.create({
      username: actor?.name || cleanUsername,
      body: cleanBody,
      email: actor?.email || cleanEmail,
      score: numericScore,
      productID,
      user: actor?._id,
    });
    await ProductModel.updateOne({ _id: productID }, { $addToSet: { comments: comment._id } });
    return Response.json({ message: "Comment created successfully", data: comment }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Comment creation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDB();
    const comments = await CommentModel.find(
      { isAccept: true },
      "username body score date productID createdAt updatedAt"
    ).sort({ date: -1 });
    return Response.json(comments);
  } catch (err) {
    return Response.json({ message: err.message || "Comments fetch failed" }, { status: 500 });
  }
}
