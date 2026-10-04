"use client";
import React, { useEffect, useState } from "react";
import swal from "sweetalert";
import styles from "@/styles/p-user/sendTicket.module.css";
import Link from "next/link";
import { IoIosSend } from "react-icons/io";

function SendTicket() {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [departments, setDepartments] = useState([]); const [subDepartments, setSubDepartments] = useState([]); const [departmentID, setDepartmentID] = useState(""); const [subDepartmentID, setSubDepartmentID] = useState(""); const [priority, setPriority] = useState(1); const [attachment, setAttachment] = useState(null);
  useEffect(() => { fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(Array.isArray(d) ? d : [])); }, []);
  useEffect(() => { if (!departmentID) return setSubDepartments([]); fetch(`/api/departments/sub/${departmentID}`).then((r) => r.ok ? r.json() : []).then((d) => setSubDepartments(Array.isArray(d) ? d : [])); }, [departmentID]);

  const sendTicket = async () => {
    if (!title.trim() || !body.trim() || !departmentID || !subDepartmentID) return swal({ title: "اطلاعات تیکت را کامل کنید", icon: "error", buttons: "فهمیدم" });
    const form = new FormData();
    form.append("title", title); form.append("body", body); form.append("department", departmentID); form.append("subDepartment", subDepartmentID); form.append("priority", String(priority)); if (attachment) form.append("attachment", attachment);
    const res = await fetch("/api/tickets", { method: "POST", body: form }); const data = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: data.message || "ارسال تیکت انجام نشد", icon: "error", buttons: "فهمیدم" });
    swal({ title: "تیکت ثبت شد", icon: "success", buttons: "مشاهده تیکت‌ها" }).then(() => location.replace("/p-user/tickets"));
  };

  return <main className={styles.container}><h1 className={styles.title}><span>ارسال تیکت جدید</span><Link href="/p-user/tickets">همه تیکت ها</Link></h1><div className={styles.content}><div className={styles.group}><label>دپارتمان</label><select value={departmentID} onChange={(e) => { setDepartmentID(e.target.value); setSubDepartmentID(""); }}><option value="">انتخاب کنید</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select></div><div className={styles.group}><label>نوع تیکت</label><select value={subDepartmentID} onChange={(e) => setSubDepartmentID(e.target.value)}><option value="">انتخاب کنید</option>{subDepartments.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select></div><div className={styles.group}><label>عنوان</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className={styles.group}><label>اولویت</label><select value={priority} onChange={(e) => setPriority(Number(e.target.value))}><option value={1}>کم</option><option value={2}>متوسط</option><option value={3}>بالا</option></select></div></div><div className={styles.group}><label>محتوا</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} /></div><div className={styles.uploader}><span>حداکثر اندازه: ۶ مگابایت</span><span>فرمت‌های مجاز: JPG، PNG، WebP، GIF</span><input accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} /></div><button type="button" className={styles.btn} onClick={sendTicket}><IoIosSend />ارسال تیکت</button></main>;
}
export default SendTicket;
