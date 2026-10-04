"use client";
import React, { useEffect, useState } from "react";
import styles from "./Nabvar.module.css";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";
import { FaShoppingCart, FaRegHeart } from "react-icons/fa";

function Navbar({ isLogin }) {
  const [fixTop, setFixTop] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(Array.isArray(cart) ? cart.reduce((sum, item) => sum + Math.max(0, Number(item.count) || 0), 0) : 0);
      } catch { setCartCount(0); }
    };
    const onScroll = () => setFixTop(window.pageYOffset > 105);
    updateCart(); onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("cart-updated", updateCart);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("cart-updated", updateCart); };
  }, []);

  useEffect(() => {
    if (!isLogin) return setWishlistCount(0);
    fetch("/api/wishlist", { cache: "no-store" }).then((r) => r.ok ? r.json() : { count: 0 }).then((d) => setWishlistCount(Number(d.count) || 0)).catch(() => setWishlistCount(0));
  }, [isLogin]);

  return <nav className={fixTop ? styles.navbar_fixed : styles.navbar}><main><div><Link href="/"><img src="/images/logo.png" alt="Logo" /></Link></div><ul className={styles.links}><li><Link href="/">صفحه اصلی</Link></li><li><Link href="/category">فروشگاه</Link></li><li><Link href="/blog">وبلاگ</Link></li><li><Link href="/contact-us">تماس با ما</Link></li><li><Link href="/about-us">درباره ما</Link></li><li><Link href="/rules">قوانین</Link></li>{!isLogin ? <li><Link href="/login-register">ورود / عضویت</Link></li> : <div className={styles.dropdown}><Link href="/p-user"><IoIosArrowDown className={styles.dropdown_icons} />حساب کاربری</Link><div className={styles.dropdown_content}><Link href="/p-user/orders">سفارشات</Link><Link href="/p-user/tickets">تیکت های پشتیبانی</Link><Link href="/p-user/comments">کامنت‌ها</Link><Link href="/p-user/wishlist">علاقه‌مندی‌ها</Link><Link href="/p-user/account-details">جزئیات اکانت</Link></div></div>}</ul><div className={styles.navbar_icons}><Link href="/cart"><FaShoppingCart />{cartCount > 0 && <span>{cartCount}</span>}</Link><Link href="/wishlist"><FaRegHeart />{wishlistCount > 0 && <span>{wishlistCount}</span>}</Link></div></main></nav>;
}
export default Navbar;
