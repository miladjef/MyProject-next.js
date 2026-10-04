"use client";
import { useState } from "react";
import styles from "./table.module.css";
import swal from "sweetalert";
import { useRouter } from "next/navigation";

function AddDiscount() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", percent: "", maxUse: "", minOrderAmount: "0", perUserLimit: "1", expiresAt: "" });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const addDiscount = async () => {
    const res = await fetch("/api/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: data.message || "ثبت کد تخفیف انجام نشد", icon: "error", buttons: "فهمیدم" });
    await swal({ title: "کد تخفیف ایجاد شد", icon: "success", buttons: "فهمیدم" });
    setForm({ code: "", percent: "", maxUse: "", minOrderAmount: "0", perUserLimit: "1", expiresAt: "" });
    router.refresh();
  };
  return <section className={styles.discount}><p>افزودن کد تخفیف جدید</p><div className={styles.discount_main}><div><label>کد تخفیف</label><input value={form.code} onChange={(e)=>set("code",e.target.value)} /></div><div><label>درصد تخفیف</label><input inputMode="numeric" value={form.percent} onChange={(e)=>set("percent",e.target.value.replace(/\D/g,""))} /></div><div><label>حداکثر استفاده</label><input inputMode="numeric" value={form.maxUse} onChange={(e)=>set("maxUse",e.target.value.replace(/\D/g,""))} /></div><div><label>حداقل مبلغ سفارش</label><input inputMode="numeric" value={form.minOrderAmount} onChange={(e)=>set("minOrderAmount",e.target.value.replace(/\D/g,""))} /></div><div><label>سقف استفاده هر کاربر</label><input inputMode="numeric" value={form.perUserLimit} onChange={(e)=>set("perUserLimit",e.target.value.replace(/\D/g,""))} /></div><div><label>تاریخ انقضا</label><input type="datetime-local" value={form.expiresAt} onChange={(e)=>set("expiresAt",e.target.value)} /></div></div><button type="button" onClick={addDiscount}>افزودن</button></section>;
}
export default AddDiscount;
