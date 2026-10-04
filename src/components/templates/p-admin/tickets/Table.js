"use client";
import styles from "./table.module.css";
import { useRouter } from "next/navigation";
import { showSwal } from "@/utils/helpers";
import swal from "sweetalert";

export default function DataTable({ tickets, title }) {
  const router = useRouter();
  const answerToTicket = (ticket) => swal({ title: "پاسخ را وارد کنید", content: "input", buttons: ["لغو", "ثبت پاسخ"] }).then(async (answerText) => {
    if (!answerText) return;
    const res = await fetch("/api/tickets/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: answerText, ticketID: ticket._id }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: data.message || "ثبت پاسخ انجام نشد", icon: "error", buttons: "فهمیدم" });
    await swal({ title: "پاسخ ثبت شد", icon: "success", buttons: "فهمیدم" }); router.refresh();
  });
  const ban = async (ticket) => {
    const user = ticket.user;
    if (!user) return swal({ title: "کاربر حذف شده است", icon: "error", buttons: "فهمیدم" });
    const res = await fetch("/api/user/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, phone: user.phone }) });
    if (res.ok) swal({ title: "کاربر مسدود شد", icon: "success", buttons: "فهمیدم" });
  };
  return <div><div><h1 className={styles.title}><span>{title}</span></h1></div><div className={styles.table_container}><table className={styles.table}><thead><tr><th>شناسه</th><th>کاربر</th><th>عنوان</th><th>دپارتمان</th><th>پیوست</th><th>مشاهده</th><th>پاسخ</th><th>بن</th></tr></thead><tbody>{tickets.map((ticket,index)=><tr key={ticket._id}><td>{index+1}</td><td>{ticket.user?.name||"کاربر حذف شده"}</td><td>{ticket.title}</td><td>{ticket.department?.title||"-"}</td><td>{ticket.attachment?<a href={ticket.attachment} target="_blank" rel="noreferrer">مشاهده</a>:"-"}</td><td><button type="button" className={styles.edit_btn} onClick={()=>showSwal(ticket.body,undefined,"بستن")}>مشاهده</button></td><td><button type="button" className={styles.delete_btn} onClick={()=>answerToTicket(ticket)}>پاسخ</button></td><td><button type="button" className={styles.delete_btn} onClick={()=>ban(ticket)}>بن</button></td></tr>)}</tbody></table></div></div>;
}
