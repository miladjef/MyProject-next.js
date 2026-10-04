import Table from "@/components/templates/p-admin/discounts/Table";
import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/discounts/table.module.css";
import DiscountModel from "@/models/Discount";
import AddDiscount from "@/components/templates/p-admin/discounts/AddDiscount";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";
import Pagination from "@/components/modules/pagination/Pagination";

export default async function Discounts({ searchParams }) {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1), limit = 50;
  const [discounts, total] = await Promise.all([
    DiscountModel.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DiscountModel.countDocuments({}),
  ]);
  return <Layout user={admin}><main><AddDiscount />{discounts.length === 0 ? <p className={styles.empty}>کد تخفیفی وجود ندارد</p> : <><Table discounts={JSON.parse(JSON.stringify(discounts))} title="لیست تخفیفات" /><Pagination page={page} pages={Math.max(1, Math.ceil(total / limit))} basePath="/p-admin/discounts" /></>}</main></Layout>;
}
