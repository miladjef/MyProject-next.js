import CommentModel from "@/models/Comment";
import ProductModel from "@/models/Product";

const recalculateProductRating = async (productID) => {
  if (!productID) return;
  const [result] = await CommentModel.aggregate([
    { $match: { productID, isAccept: true } },
    { $group: { _id: "$productID", average: { $avg: "$score" } } },
  ]);
  const score = result?.average ? Math.max(1, Math.min(5, Number(result.average.toFixed(2)))) : 5;
  await ProductModel.updateOne({ _id: productID }, { $set: { score } });
};

export { recalculateProductRating };
