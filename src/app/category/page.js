import Navbar from "@/components/modules/navbar/Navbar";
import Footer from "@/components/modules/footer/Footer";
import Product from "@/components/modules/product/Product";
import ProductModel from "@/models/Product";
import { authUser } from "@/utils/serverHelpers";
import connectToDB from "@/configs/db";
import Pagination from "@/components/modules/pagination/Pagination";
import { activeProductFilter } from "@/utils/productFilters";

export default async function Page({ searchParams }) {
  await connectToDB();
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = 24;
  const filter = activeProductFilter;
  const [user, products, total] = await Promise.all([
    authUser(),
    ProductModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ProductModel.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / limit));
  return <><Navbar isLogin={Boolean(user)} /><main className="container" style={{ padding: "140px 0 60px", direction: "rtl" }}><h1 style={{ marginBottom: 30 }}>فروشگاه</h1><section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 24 }}>{products.map((p) => <Product key={String(p._id)} {...JSON.parse(JSON.stringify(p))} />)}</section>{!products.length && <p>محصولی ثبت نشده است.</p>}<Pagination page={page} pages={pages} basePath="/category" /></main><Footer /></>;
}
