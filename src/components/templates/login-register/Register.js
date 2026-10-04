"use client";

import { useState } from "react";
import styles from "./register.module.css";
import Sms from "./Sms";
import { showSwal } from "@/utils/helpers";
import {
  valiadteEmail,
  valiadtePassword,
  valiadtePhone,
} from "@/utils/validation";

const Register = ({ showloginForm }) => {
  const [withPass, setWithPass] = useState(false);
  const [otp, setOtp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const sendOtp = async (includePassword = false) => {
    if (
      !name.trim() ||
      !valiadtePhone(phone) ||
      (email && !valiadteEmail(email)) ||
      (includePassword && !valiadtePassword(password))
    ) {
      return showSwal(
        includePassword
          ? "نام، شماره، ایمیل و رمز عبور معتبر وارد کنید"
          : "نام و شماره معتبر وارد کنید",
        "error",
        "تلاش مجدد"
      );
    }

    const res = await fetch("/api/auth/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, mode: "register" }),
    });

    if (res.status === 202) {
      setWithPass(includePassword);
      setOtp(true);
      return;
    }
    if (res.status === 409) {
      return showSwal("این شماره قبلا ثبت شده است", "error", "ورود");
    }
    if (res.status === 429) {
      return showSwal("برای ارسال مجدد کمی صبر کنید", "error", "فهمیدم");
    }
    return showSwal("ارسال کد انجام نشد", "error", "تلاش مجدد");
  };

  if (otp) {
    return (
      <Sms
        hideOtpForm={() => setOtp(false)}
        phone={phone}
        mode="register"
        name={name}
        email={email}
        password={withPass ? password : ""}
      />
    );
  }

  return (
    <>
      <div className={styles.form}>
        <input
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="نام"
        />
        <input
          className={styles.input}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="شماره موبایل"
        />
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ایمیل"
        />
        {withPass && (
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="رمز عبور"
            autoComplete="new-password"
          />
        )}
        <button
          type="button"
          className={styles.btn}
          onClick={() => sendOtp(false)}
        >
          ثبت نام با کد تایید
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => (withPass ? sendOtp(true) : setWithPass(true))}
        >
          ثبت نام با رمز عبور
        </button>
        <p onClick={showloginForm} className={styles.back_to_login}>
          برگشت به ورود
        </p>
      </div>
    </>
  );
};

export default Register;
