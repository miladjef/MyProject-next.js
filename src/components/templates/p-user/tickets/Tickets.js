"use client";
import { useMemo, useState } from "react";
import styles from "@/styles/p-user/tickets.module.css";
import Link from "next/link";
import Ticket from "./Ticket";

function Tickets({ tickets }) {
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const filtered = useMemo(() => {
    const list = tickets.filter((ticket) => status === "all" || (status === "answered" ? ticket.hasAnswer : !ticket.hasAnswer));
    return [...list].sort((a,b) => sort === "oldest" ? new Date(a.createdAt)-new Date(b.createdAt) : new Date(b.createdAt)-new Date(a.createdAt));
  }, [tickets,status,sort]);
  const answered = tickets.filter((t)=>t.hasAnswer).length;
  return <main className={styles.container}><h1 className={styles.title}><span>همه تیکت ها</span><Link href="/p-user/tickets/sendTicket">ارسال تیکت جدید</Link></h1><div className={styles.boxes}><span>همه: {tickets.length}</span><span>پاسخ داده شده: {answered}</span><span>در انتظار پاسخ: {tickets.length-answered}</span></div><div className={styles.filtering}><div><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="answered">پاسخ داده شده</option><option value="pending">در انتظار پاسخ</option></select><select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option></select></div></div><div>{filtered.map((ticket)=><Ticket key={ticket._id} {...ticket}/>)}</div>{filtered.length===0&&<div className={styles.empty}><p>تیکتی وجود ندارد</p></div>}</main>;
}
export default Tickets;
