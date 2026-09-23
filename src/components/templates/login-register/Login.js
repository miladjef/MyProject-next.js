"use client";

import { useState } from "react";
import styles from "./login.module.css";
import Link from "next/link";
import Sms from "./Sms";
import { showSwal } from "@/utils/helpers";
import { valiadteEmail, valiadtePhone } from "@/utils/validation";
import { useRouter } from "next/navigation";
import swal from "sweetalert";

const Login = ({ showRegisterForm }) => {
  const router = useRouter();
  const [otp, setOtp] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");

  const login = async (event) => {
    event.preventDefault();
    const value = identifier.trim();
    if ((!valiadteEmail(value) && !valiadtePhone(value)) || !password) {
      return showSwal(
        "ایمیل یا شماره موبایل و رمز عبور را صحیح وارد کنید",
        "error",
        "تلاش مجدد"
      );
    }

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: value, password }),
    });

    if (res.ok) {
      return swal({
        title: "ورود با موفقیت انجام شد",
        icon: "success",
        buttons: "ورود به پنل کاربری",
      }).then(() => router.replace("/p-user"));
    }

    showSwal(
      res.status === 403 ? "حساب کاربری مسدود شده است" : "اطلاعات ورود صحیح نیست",
      "error",
      "تلاش مجدد"
    );
  };

  const requestOtp = async () => {
    if (!valiadtePhone(identifier)) {
      return showSwal("شماره موبایل معتبر وارد کنید", "error", "تلاش مجدد");
    }

    const res = await fetch("/api/auth/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: identifier, mode: "login" }),
    });

    if (res.status === 201) {
      setOtpPhone(identifier);
      setOtp(true);
      return;
    }
    if (res.status === 404) {
      return showSwal("کاربری با این شماره یافت نشد", "error", "تلاش مجدد");
    }
    if (res.status === 429) {
      return showSwal("برای ارسال مجدد کمی صبر کنید", "error", "فهمیدم");
    }
    showSwal("ارسال کد انجام نشد", "error", "تلاش مجدد");
  };

  if (otp) {
    return <Sms hideOtpForm={() => setOtp(false)} phone={otpPhone} mode="login" />;
  }

  return (
    <>
      <form onSubmit={login}>
        <div className={styles.form}>
          <input
            className={styles.input}
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="ایمیل یا شماره موبایل"
            autoComplete="username"
          />
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="رمز عبور"
            autoComplete="current-password"
          />
          <button className={styles.btn} type="submit">ورود</button>
          <Link href="/forget-password" className={styles.forgot_pass}>
            رمز عبور را فراموش کرده اید؟
          </Link>
          <button type="button" onClick={requestOtp} className={styles.btn}>
            ورود با کد یکبار مصرف
          </button>
          <span>آیا حساب کاربری ندارید؟</span>
          <button type="button" onClick={showRegisterForm} className={styles.btn_light}>
            ثبت نام
          </button>
        </div>
      </form>
      <Link href="/" className={styles.redirect_to_home}>لغو</Link>
    </>
  );
};

export default Login;
