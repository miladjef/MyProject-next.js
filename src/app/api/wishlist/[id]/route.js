import connectToDB from "@/configs/db";
import { authUser } from "@/utils/serverHelpers";
import WishlistModel from "@/models/Wishlist";
import { isValidObjectId } from "mongoose";

export async function DELETE(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid product id" }, { status: 400 });
    await WishlistModel.findOneAndDelete({ user: user._id, product: id });
    return Response.json({ message: "Product removed successfully" });
  } catch (err) {
    return Response.json({ message: err.message || "Wishlist update failed" }, { status: 500 });
  }
}
