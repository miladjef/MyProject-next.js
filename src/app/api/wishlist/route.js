import connectToDB from "@/configs/db";
import WishlistModel from "@/models/Wishlist";
import ProductModel from "@/models/Product";
import { authUser } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { product } = await req.json();
    if (!isValidObjectId(product)) return Response.json({ message: "Invalid product id" }, { status: 400 });
    if (!(await ProductModel.exists({ _id: product }))) return Response.json({ message: "Product not found" }, { status: 404 });

    await WishlistModel.updateOne(
      { user: user._id, product },
      { $setOnInsert: { user: user._id, product } },
      { upsert: true }
    );
    return Response.json({ message: "Product added to wishlist successfully" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message || "Wishlist update failed" }, { status: 500 });
  }
}
