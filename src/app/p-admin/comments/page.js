import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/comments/table.module.css";
import Table from "@/components/templates/p-admin/comments/Table";
import CommentModel from "@/models/Comment";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";
import Pagination from "@/components/modules/pagination/Pagination";

export default async function Page({ searchParams }) {
  const admin = await authAdmin(); if (!admin) redirect("/login-register");
  const params = await searchParams; const page = Math.max(1, Number(params?.page) || 1), limit = 50;
  const [comments,total] = await Promise.all([CommentModel.find({}).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).populate("productID","name").lean(),CommentModel.countDocuments({})]);
  return <Layout user={admin}><main>{comments.length===0?<p className={styles.empty}>کامنتی وجود ندارد</p>:<><Table comments={JSON.parse(JSON.stringify(comments))} title="لیست کامنت‌ها"/><Pagination page={page} pages={Math.max(1,Math.ceil(total/limit))} basePath="/p-admin/comments"/></>}</main></Layout>;
}
