"use client";

import Link from "next/link";
import styles from "./table.module.css";
import totalStyles from "./totals.module.css";
import { IoMdClose } from "react-icons/io";
import { useEffect, useMemo, useState } from "react";
import { showSwal } from "@/utils/helpers";

const normalizeCart = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item?.id && Number(item.count) > 0)
    .map((item) => ({ ...item, count: Math.max(1, Math.min(99, Number(item.count) || 1)) }));
};

const Table = () => {
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const localSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.count || 0), 0),
    [cart]
  );

  const fetchQuote = async (items, coupon = "") => {
    if (!items.length) {
      setQuote(null);
      return null;
    }
    setLoadingQuote(true);
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, count: item.count })),
          couponCode: coupon,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "بررسی سبد خرید انجام نشد");

      const refreshedCart = data.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        count: item.count,
      }));
      setCart(refreshedCart);
      localStorage.setItem("cart", JSON.stringify(refreshedCart));
      setQuote(data);
      window.dispatchEvent(new Event("cart-updated"));
      return data;
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    try {
      const currentCart = normalizeCart(JSON.parse(localStorage.getItem("cart") || "[]"));
      const savedCoupon = String(localStorage.getItem("checkoutCoupon") || "").trim().toUpperCase();
      setCart(currentCart);
      setCouponCode(savedCoupon);
      if (currentCart.length) {
        fetchQuote(currentCart, savedCoupon).catch(() => {
          localStorage.removeItem("checkoutCoupon");
          setCouponCode("");
        });
      }
    } catch {
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutCoupon");
    }
  }, []);

  const save = async (nextCart, keepCoupon = true) => {
    const normalized = normalizeCart(nextCart);
    setCart(normalized);
    localStorage.setItem("cart", JSON.stringify(normalized));
    window.dispatchEvent(new Event("cart-updated"));
    const coupon = keepCoupon ? couponCode.trim().toUpperCase() : "";
    if (!keepCoupon) {
      setCouponCode("");
      localStorage.removeItem("checkoutCoupon");
    }
    try {
      await fetchQuote(normalized, coupon);
    } catch (error) {
      if (coupon) {
        setCouponCode("");
        localStorage.removeItem("checkoutCoupon");
        await fetchQuote(normalized, "").catch(() => setQuote(null));
      } else {
        setQuote(null);
      }
      showSwal(error.message || "سبد خرید به روز نشد", "error", "فهمیدم");
    }
  };

  const changeCount = (id, delta) => {
    const next = cart.map((item) =>
      item.id === id ? { ...item, count: Math.max(1, Math.min(99, item.count + delta)) } : item
    );
    save(next);
  };

  const remove = (id) => save(cart.filter((item) => item.id !== id));

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return showSwal("کد تخفیف را وارد کنید", "error", "فهمیدم");
    try {
      const data = await fetchQuote(cart, code);
      setCouponCode(code);
      localStorage.setItem("checkoutCoupon", code);
      showSwal(`کد تخفیف ${data.discountPercent} درصدی اعمال شد`, "success", "فهمیدم");
    } catch (error) {
      localStorage.removeItem("checkoutCoupon");
      setQuote(null);
      showSwal(error.message || "کد تخفیف معتبر نیست", "error", "تلاش مجدد");
    }
  };

  const subtotal = quote?.subtotal ?? localSubtotal;
  const shippingCost = quote?.shippingCost ?? (cart.length ? 30000 : 0);
  const total = quote?.total ?? subtotal + shippingCost;

  return (
    <>
      <div className={styles.tabel_container}>
        <table className={styles.table}>
          <thead><tr><th>جمع جزء</th><th>تعداد</th><th>قیمت</th><th>محصول</th><th></th></tr></thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{(item.count * item.price).toLocaleString()} تومان</td>
                <td className={styles.counter}><div><button type="button" onClick={() => changeCount(item.id, -1)}>-</button><p>{item.count}</p><button type="button" onClick={() => changeCount(item.id, 1)}>+</button></div></td>
                <td className={styles.price}>{Number(item.price).toLocaleString()} تومان</td>
                <td className={styles.product}>{item.img && <img src={item.img} alt={item.name} />}<Link href={`/product/${item.id}`}>{item.name}</Link></td>
                <td><button type="button" onClick={() => remove(item.id)} aria-label="حذف"><IoMdClose className={styles.delete_icon} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cart.length && <p style={{ padding: 24, textAlign: "center" }}>سبد خرید خالی است.</p>}
        <section><div><button className={styles.set_off_btn} type="button" onClick={applyCoupon} disabled={!cart.length || loadingQuote}>{loadingQuote ? "در حال بررسی" : "اعمال کوپن"}</button><input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="کد تخفیف" /></div></section>
      </div>

      <div className={totalStyles.totals}>
        <p className={totalStyles.totals_title}>جمع کل سبد خرید</p>
        <div className={totalStyles.subtotal}><p>جمع جزء</p><p>{subtotal.toLocaleString()} تومان</p></div>
        {quote?.discountAmount > 0 && <div className={totalStyles.subtotal}><p>تخفیف</p><p>{quote.discountAmount.toLocaleString()} تومان</p></div>}
        <p className={totalStyles.motor}>هزینه ارسال: <strong>{shippingCost.toLocaleString()} تومان</strong></p>
        <div className={totalStyles.total}><p>مجموع</p><p>{total.toLocaleString()} تومان</p></div>
        {cart.length ? <Link href="/checkout"><button className={totalStyles.checkout_btn}>ادامه جهت تسویه حساب</button></Link> : <Link href="/category"><button className={totalStyles.checkout_btn}>بازگشت به فروشگاه</button></Link>}
      </div>
    </>
  );
};

export default Table;
