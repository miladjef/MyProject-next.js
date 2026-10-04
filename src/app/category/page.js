import Navbar from "@/components/modules/navbar/Navbar";
import Footer from "@/components/modules/footer/Footer";
import Product from "@/components/modules/product/Product";
import ProductModel from "@/models/Product";
import ProductCategoryModel from "@/models/ProductCategory";
import BrandModel from "@/models/Brand";
import { authUser } from "@/utils/serverHelpers";
import connectToDB from "@/configs/db";
import Pagination from "@/components/modules/pagination/Pagination";
import { activeProductFilter } from "@/utils/productFilters";
import Link from "next/link";

export const metadata = { title: "فروشگاه", description: "فهرست محصولات فروشگاه" };

export default async function Page({ searchParams }) {
  await connectToDB();
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const categorySlug = String(params?.category || "").trim();
  const brandSlug = String(params?.brand || "").trim();
  const limit = 24;
  const filter = { ...activeProductFilter };
  const [category, brand, categories, brands] = await Promise.all([
    categorySlug ? ProductCategoryModel.findOne({ slug: categorySlug, isActive: true }).lean() : null,
    brandSlug ? BrandModel.findOne({ slug: brandSlug, isActive: true }).lean() : null,
    ProductCategoryModel.find({ isActive: true }).sort({ name: 1 }).lean(),
    BrandModel.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);
  const invalidTaxonomy = (categorySlug && !category) || (brandSlug && !brand);
  if (invalidTaxonomy) filter._id = null;
  if (category) filter.category = category._id;
  if (brand) filter.brand = brand._id;
  const [user, products, total] = await Promise.all([
    authUser(),
    ProductModel.find(filter).populate("category", "name slug").populate("brand", "name slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ProductModel.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / limit));
  return <><Navbar isLogin={Boolean(user)} /><main className="container" style={{ padding: "140px 0 60px", direction: "rtl" }}><h1 style={{ marginBottom: 20 }}>{category?.name || brand?.name || "فروشگاه"}</h1><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 30 }}><Link href="/category">همه</Link>{categories.map((item)=><Link key={String(item._id)} href={`/category?category=${encodeURIComponent(item.slug)}`}>{item.name}</Link>)}{brands.map((item)=><Link key={String(item._id)} href={`/category?brand=${encodeURIComponent(item.slug)}`}>{item.name}</Link>)}</div><section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 24 }}>{products.map((p) => <Product key={String(p._id)} {...JSON.parse(JSON.stringify(p))} />)}</section>{!products.length && <p>محصولی ثبت نشده است.</p>}<Pagination page={page} pages={pages} basePath="/category" query={{ category: categorySlug, brand: brandSlug }} /></main><Footer /></>;
}
