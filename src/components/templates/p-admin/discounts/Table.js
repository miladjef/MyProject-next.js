"use client";
import styles from "./table.module.css";
import swal from "sweetalert";
import { useRouter } from "next/navigation";

export default function Table({ discounts }) {
  const router = useRouter();
  const remove = (id) => swal({ title: "کد تخفیف حذف شود؟", icon: "warning", buttons: ["خیر", "بله"] }).then(async (ok) => {
    if (!ok) return;
    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  });
  const toggle = async (discount) => {
    const res = await fetch(`/api/discounts/${discount._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !discount.isActive }) });
    if (res.ok) router.refresh();
  };
  return <table className={styles.table}><thead><tr><th>شناسه</th><th>کد</th><th>درصد</th><th>حداکثر استفاده</th><th>مصرف</th><th>وضعیت</th><th>حذف</th></tr></thead><tbody>{discounts.map((d, index) => <tr key={d._id}><td className={d.uses >= d.maxUse ? styles.red : styles.green}>{index + 1}</td><td>{d.code}</td><td>{d.percent}</td><td>{d.maxUse}</td><td>{d.uses}</td><td><button type="button" className={styles.edit_btn} onClick={() => toggle(d)}>{d.isActive === false ? "غیرفعال" : "فعال"}</button></td><td><button type="button" className={styles.delete_btn} onClick={() => remove(d._id)}>حذف</button></td></tr>)}</tbody></table>;
}
