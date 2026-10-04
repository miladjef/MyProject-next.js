"use client";
export default function ErrorPage({ reset }) {
  return <main className="container" style={{ padding: "140px 20px", direction: "rtl" }}><h1>خطا در بارگذاری صفحه</h1><p>درخواست کامل نشد.</p><button type="button" onClick={() => reset()}>تلاش مجدد</button></main>;
}
