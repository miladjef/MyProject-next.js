import connectToDB from "@/configs/db";
import WishlistModel from "@/models/Wishlist";
import ProductModel from "@/models/Product";
import { authUser } from "@/utils/serverHelpers";
import { isValidObjectId } from "mongoose";
import { activeProductFilter } from "@/utils/productFilters";
import { safeServerError } from "@/utils/apiError";

export async function POST(req) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { product } = await req.json();
    if (!isValidObjectId(product)) return Response.json({ message: "Invalid product id" }, { status: 400 });
    if (!(await ProductModel.exists({ _id: product, ...activeProductFilter }))) {
      return Response.json({ message: "Product not found" }, { status: 404 });
    }

    await WishlistModel.updateOne(
      { user: user._id, product },
      { $setOnInsert: { user: user._id, product } },
      { upsert: true }
    );
    return Response.json({ message: "Product added to wishlist successfully" }, { status: 201 });
  } catch (err) {
    return safeServerError(err, "api.wishlist");
  }
}


export async function GET() {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const items = await WishlistModel.find({ user: user._id })
      .populate({ path: "product", match: activeProductFilter, select: "name price img status" })
      .sort({ createdAt: -1 })
      .lean();
    const visibleItems = items.filter((item) => item.product);
    return Response.json({ items: visibleItems, count: visibleItems.length });
  } catch (err) {
    return safeServerError(err, "api.wishlist");
  }
}
