"use client";
import { useState } from "react";
import styles from "@/styles/forget-password.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showSwal } from "@/utils/helpers";

export default function ForgotPassword() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    const res = await fetch("/api/auth/sms/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, mode: "reset" }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showSwal(data.message || "ارسال کد انجام نشد", "error", "فهمیدم");
    setSent(true); showSwal("کد تایید ارسال شد", "success", "فهمیدم");
  };

  const reset = async () => {
    const res = await fetch("/api/auth/sms/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code, mode: "reset", newPassword }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showSwal(data.message || "بازنشانی رمز انجام نشد", "error", "فهمیدم");
    showSwal("رمز عبور تغییر کرد", "success", "ورود"); router.replace("/login-register");
  };

  return <div className={styles.forgot_password}><div data-aos="fade-up" className={styles.bg}><div className={styles.form}><input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره موبایل" />{sent && <><input className={styles.input} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="کد تایید" /><input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز عبور جدید" /></>}<button type="button" onClick={sent ? reset : send} style={{ marginTop: "1rem" }} className={styles.btn}>{sent ? "ثبت رمز عبور جدید" : "ارسال کد بازنشانی"}</button><Link href="/login-register" className={styles.back_to_login}>برگشت به ورود</Link></div><Link href="/login-register" className={styles.redirect_to_home}>لغو</Link></div><section><img src="/images/logo.png" alt="" /></section></div>;
}
