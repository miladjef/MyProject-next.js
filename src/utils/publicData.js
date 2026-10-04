import { unstable_cache } from "next/cache";
import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import ArticleModel from "@/models/Article";
import { activeProductFilter } from "@/utils/productFilters";

const getLatestProducts = unstable_cache(async (limit = 8) => {
  await connectToDB();
  const items = await ProductModel.find(activeProductFilter)
    .select("name slug price score img imgAlt stock inventoryTracked")
    .sort({ createdAt: -1, _id: -1 })
    .limit(Math.min(24, Math.max(1, Number(limit) || 8)))
    .lean();
  return JSON.parse(JSON.stringify(items));
}, ["latest-products"], { revalidate: 60, tags: ["products"] });

const getLatestArticles = unstable_cache(async (limit = 2) => {
  await connectToDB();
  const items = await ArticleModel.find({ status: "PUBLISHED" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.min(10, Math.max(1, Number(limit) || 2)))
    .select("title slug excerpt img author publishedAt createdAt")
    .lean();
  return JSON.parse(JSON.stringify(items));
}, ["latest-articles"], { revalidate: 300, tags: ["articles"] });

export { getLatestProducts, getLatestArticles };
