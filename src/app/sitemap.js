import connectToDB from "@/configs/db";
import ProductModel from "@/models/Product";
import ArticleModel from "@/models/Article";
import ProductCategoryModel from "@/models/ProductCategory";
import { activeProductFilter } from "@/utils/productFilters";

export default async function sitemap() {
  await connectToDB();
  const base = (process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
  const [products, articles, categories] = await Promise.all([
    ProductModel.find(activeProductFilter).select("slug updatedAt").lean(),
    ArticleModel.find({ status: "PUBLISHED" }).select("slug updatedAt").lean(),
    ProductCategoryModel.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/category`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...products.map((item) => ({ url: `${base}/product/${encodeURIComponent(item.slug || String(item._id))}`, lastModified: item.updatedAt, changeFrequency: "daily", priority: 0.8 })),
    ...articles.map((item) => ({ url: `${base}/article/${encodeURIComponent(item.slug)}`, lastModified: item.updatedAt, changeFrequency: "monthly", priority: 0.6 })),
    ...categories.map((item) => ({ url: `${base}/category?category=${encodeURIComponent(item.slug)}`, lastModified: item.updatedAt, changeFrequency: "daily", priority: 0.7 })),
  ];
}
