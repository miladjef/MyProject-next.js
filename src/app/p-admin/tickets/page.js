import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/tickets/table.module.css";
import Table from "@/components/templates/p-admin/tickets/Table";
import TicketModel from "@/models/Ticket";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";
import Pagination from "@/components/modules/pagination/Pagination";

export default async function Page({ searchParams }) {
  const admin = await authAdmin(); if (!admin) redirect("/login-register");
  const params = await searchParams; const page = Math.max(1, Number(params?.page) || 1), limit = 50; const filter = { isAnswer: false };
  const [tickets,total] = await Promise.all([TicketModel.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).populate("user","name email phone role").populate("department","title").lean(),TicketModel.countDocuments(filter)]);
  return <Layout user={admin}><main>{tickets.length===0?<p className={styles.empty}>تیکتی وجود ندارد</p>:<><Table tickets={JSON.parse(JSON.stringify(tickets))} title="لیست تیکت‌ها"/><Pagination page={page} pages={Math.max(1,Math.ceil(total/limit))} basePath="/p-admin/tickets"/></>}</main></Layout>;
}
