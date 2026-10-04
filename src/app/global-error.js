"use client";
export default function GlobalError({ reset }) {
  return <html lang="fa" dir="rtl"><body><main style={{ padding: 40 }}><h1>خطای برنامه</h1><p>بارگذاری برنامه کامل نشد.</p><button type="button" onClick={() => reset()}>تلاش مجدد</button></main></body></html>;
}
