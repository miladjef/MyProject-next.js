import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/products/table.module.css";
import Table from "@/components/templates/p-admin/products/Table";
import ProductModel from "@/models/Product";
import AddProduct from "@/components/templates/p-admin/products/AddProduct";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";
import Pagination from "@/components/modules/pagination/Pagination";

export default async function Page({ searchParams }) {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = 50;
  const [products, total] = await Promise.all([
    ProductModel.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ProductModel.countDocuments({}),
  ]);
  return <Layout user={admin}><main><AddProduct />{products.length === 0 ? <p className={styles.empty}>محصولی وجود ندارد</p> : <><Table products={JSON.parse(JSON.stringify(products))} title="لیست محصولات" /><Pagination page={page} pages={Math.max(1, Math.ceil(total / limit))} basePath="/p-admin/products" /></>}</main></Layout>;
}
