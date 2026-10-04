"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showSwal } from "@/utils/helpers";

const CheckoutSummary = ({ isLogin }) => {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({ province: "", city: "", postalCode: "", addressLine: "" });
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    (async () => {
      try {
        const items = JSON.parse(localStorage.getItem("cart") || "[]");
        const couponCode = String(localStorage.getItem("checkoutCoupon") || "");
        if (!Array.isArray(items) || !items.length) return;
        setCart(items);
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((item) => ({ id: item.id, count: item.count })), couponCode }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "بررسی سبد خرید انجام نشد");
        setQuote(data);
      } catch (error) {
        showSwal(error.message || "بررسی سبد خرید انجام نشد", "error", "فهمیدم");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateAddress = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));

  const createOrder = async () => {
    if (!isLogin) return router.push("/login-register");
    if (!address.province.trim() || !address.city.trim() || !/^\d{5,20}$/.test(address.postalCode.replace(/\s/g, "")) || !address.addressLine.trim()) {
      return showSwal("آدرس و کدپستی را کامل وارد کنید", "error", "فهمیدم");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item.id, count: item.count })),
          couponCode: localStorage.getItem("checkoutCoupon") || "",
          address,
          paymentMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "ثبت سفارش انجام نشد");
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutCoupon");
      window.dispatchEvent(new Event("cart-updated"));
      router.replace(`/complate?order=${encodeURIComponent(data.order.id)}`);
    } catch (error) {
      showSwal(error.message || "ثبت سفارش انجام نشد", "error", "فهمیدم");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>در حال بررسی سبد خرید...</p>;
  if (!quote?.items?.length) return <p>سبد خرید خالی است. <Link href="/category">بازگشت به فروشگاه</Link></p>;

  return (
    <section>
      <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        {quote.items.map((item) => <p key={item.id}>{item.name}، {item.count} عدد، {(item.price * item.count).toLocaleString()} تومان</p>)}
        <p>جمع کالاها: {quote.subtotal.toLocaleString()} تومان</p>
        {quote.discountAmount > 0 && <p>تخفیف: {quote.discountAmount.toLocaleString()} تومان</p>}
        <p>ارسال: {quote.shippingCost.toLocaleString()} تومان</p>
        <h2>مبلغ نهایی: {quote.total.toLocaleString()} تومان</h2>
      </div>

      <div style={{ display: "grid", gap: 12, maxWidth: 620 }}>
        <input value={address.province} onChange={(e) => updateAddress("province", e.target.value)} placeholder="استان" />
        <input value={address.city} onChange={(e) => updateAddress("city", e.target.value)} placeholder="شهر" />
        <input inputMode="numeric" value={address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value.replace(/\D/g, ""))} placeholder="کد پستی" />
        <textarea value={address.addressLine} onChange={(e) => updateAddress("addressLine", e.target.value)} placeholder="نشانی کامل" rows={4} />
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">پرداخت هنگام تحویل</option>
          <option value="MANUAL">پرداخت دستی</option>
        </select>
        {!isLogin && <p>برای ثبت سفارش ابتدا وارد حساب کاربری شوید.</p>}
        <button type="button" onClick={createOrder} disabled={submitting}>{submitting ? "در حال ثبت سفارش" : isLogin ? "ثبت سفارش" : "ورود و ادامه"}</button>
      </div>
    </section>
  );
};

export default CheckoutSummary;
