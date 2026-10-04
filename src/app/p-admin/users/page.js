import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/users/table.module.css";
import Table from "@/components/templates/p-admin/users/Table";
import UserModel from "@/models/User";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";
import Pagination from "@/components/modules/pagination/Pagination";

export default async function Page({ searchParams }) {
  const admin = await authAdmin(); if (!admin) redirect("/login-register");
  const params = await searchParams; const page = Math.max(1, Number(params?.page) || 1), limit = 50;
  const filter = { isDeleted: false };
  const [users,total] = await Promise.all([UserModel.find(filter,"-password -__v").sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),UserModel.countDocuments(filter)]);
  return <Layout user={admin}><main>{users.length===0?<p className={styles.empty}>کاربری وجود ندارد</p>:<><Table users={JSON.parse(JSON.stringify(users))} title="لیست کاربران"/><Pagination page={page} pages={Math.max(1,Math.ceil(total/limit))} basePath="/p-admin/users"/></>}</main></Layout>;
}
