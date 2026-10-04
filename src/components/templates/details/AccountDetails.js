"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/p-user/accountDetails.module.css";
import swal from "sweetalert";
import { IoCloudUploadOutline } from "react-icons/io5";
import { MdOutlineDelete } from "react-icons/md";

function AccountDetails() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((res) => res.json()).then((data) => {
      setName(data.name || ""); setEmail(data.email || ""); setPhone(data.phone || ""); setAvatar(data.avatar || "");
    });
  }, []);

  const notify = (title, icon = "success") => swal({ title, icon, buttons: "فهمیدم" });

  const updateUser = async () => {
    const res = await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return notify(data.message || "بروزرسانی انجام نشد", "error");
    notify("اطلاعات حساب بروزرسانی شد");
  };

  const changePassword = async () => {
    const res = await fetch("/api/user/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return notify(data.message || "تغییر رمز انجام نشد", "error");
    setCurrentPassword(""); setNewPassword(""); notify("رمز عبور تغییر کرد");
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    const form = new FormData(); form.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return notify(data.message || "آپلود تصویر انجام نشد", "error");
    setAvatar(data.avatar || ""); notify("تصویر پروفایل تغییر کرد");
  };

  const removeAvatar = async () => {
    const res = await fetch("/api/user/avatar", { method: "DELETE" });
    if (res.ok) { setAvatar(""); notify("تصویر پروفایل حذف شد"); }
  };

  return (
    <main>
      <div className={styles.details}>
        <h1 className={styles.title}><span>جزئیات اکانت</span></h1>
        <div className={styles.details_main}>
          <section>
            <div><label>نام کاربری</label><input value={name} onChange={(e) => setName(e.target.value)} type="text" /></div>
            <div><label>ایمیل</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
            <div><label>شماره تماس</label><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" /></div>
          </section>
          <section>
            <div className={styles.uploader}>
              <img src={avatar || "/images/shahin.jpg"} alt="تصویر پروفایل" />
              <div><div><button type="button"><IoCloudUploadOutline />تغییر</button><input accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={(e) => uploadAvatar(e.target.files?.[0])} /></div><button type="button" onClick={removeAvatar}><MdOutlineDelete />حذف</button></div>
            </div>
            <div><label>رمز عبور فعلی</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div><label>رمز عبور جدید</label><div className={styles.password_group}><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><button type="button" onClick={changePassword}>تغییر رمز عبور</button></div></div>
          </section>
        </div>
        <button type="button" onClick={updateUser} className={styles.submit_btn}>ثبت تغییرات</button>
      </div>
    </main>
  );
}
export default AccountDetails;
