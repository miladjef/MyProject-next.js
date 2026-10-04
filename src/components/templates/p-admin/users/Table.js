"use client";
import styles from "./table.module.css";
import swal from "sweetalert";
import { showAdminForm } from "@/utils/adminDialog";
import { useRouter } from "next/navigation";

export default function DataTable({ users, title }) {
  const router = useRouter();
  const request = async (url, options, success) => {
    const res = await fetch(url, options); const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "عملیات انجام نشد", icon: "error", buttons: "فهمیدم" });
    await swal({ title: success, icon: "success", buttons: "فهمیدم" }); router.refresh();
  };
  const changeRole = (id) => request("/api/user/role", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }, "نقش کاربر تغییر یافت");
  const removeUser = (id) => swal({ title: "کاربر حذف شود؟", icon: "warning", buttons: ["خیر", "بله"] }).then((ok) => ok && request("/api/user", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }, "کاربر حذف شد"));
  const banUser = (email, phone) => swal({ title: "کاربر مسدود شود؟", icon: "warning", buttons: ["خیر", "بله"] }).then((ok) => ok && request("/api/user/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, phone }) }, "کاربر مسدود شد"));
  const editUser = async (user) => {
    const values = await showAdminForm({ title: "ویرایش کاربر", fields: [
      { name: "name", label: "نام", value: user.name || "" },
      { name: "email", label: "ایمیل", value: user.email || "", type: "email" },
      { name: "phone", label: "شماره تماس", value: user.phone || "", type: "tel" },
    ] });
    if (!values) return;
    return request("/api/user/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user._id, ...values }) }, "اطلاعات کاربر بروزرسانی شد");
  };

  return <div><div><h1 className={styles.title}><span>{title}</span></h1></div><div className={styles.table_container}><table className={styles.table}><thead><tr><th>شناسه</th><th>نام</th><th>ایمیل</th><th>شماره</th><th>نقش</th><th>ویرایش</th><th>تغییر سطح</th><th>حذف</th><th>بن</th></tr></thead><tbody>{users.map((user, index) => <tr key={user._id}><td>{index + 1}</td><td>{user.name}</td><td>{user.email || "-"}</td><td>{user.phone || "-"}</td><td>{user.role === "USER" ? "کاربر عادی" : "مدیر"}</td><td><button type="button" className={styles.edit_btn} onClick={() => editUser(user)}>ویرایش</button></td><td><button type="button" className={styles.edit_btn} onClick={() => changeRole(user._id)}>تغییر نقش</button></td><td><button type="button" className={styles.delete_btn} onClick={() => removeUser(user._id)}>حذف</button></td><td><button type="button" onClick={() => banUser(user.email, user.phone)} className={styles.delete_btn}>بن</button></td></tr>)}</tbody></table></div></div>;
}
