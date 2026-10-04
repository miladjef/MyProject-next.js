"use client";
import { FaFacebookF, FaStar, FaTwitter, FaRegStar, FaTelegram, FaLinkedinIn, FaPinterest } from "react-icons/fa";
import { IoCheckmark } from "react-icons/io5";
import { TbSwitch3 } from "react-icons/tb";
import styles from "./details.module.css";
import Breadcrumb from "./Breadcrumb";
import AddToWishlist from "./AddToWishlist";
import { useState } from "react";
import { showSwal } from "@/utils/helpers";

const Details = ({ product }) => {
  const [count, setCount] = useState(1);
  const available = product.status !== "ARCHIVED" && (!product.inventoryTracked || Number(product.stock || 0) > 0);
  const maxCount = product.inventoryTracked ? Math.max(1, Number(product.stock || 0)) : 99;
  const starCount = Math.max(0, Math.min(5, Math.round(Number(product.score) || 0)));

  const addToCart = () => {
    if (!available) return showSwal("این محصول موجود نیست", "error", "فهمیدم");
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch { cart = []; }
    if (!Array.isArray(cart)) cart = [];
    const current = cart.find((item) => item.id === product._id);
    if (current) current.count = Math.min(maxCount, Number(current.count || 0) + count);
    else cart.push({ id: product._id, name: product.name, price: product.price, img: product.img, count: Math.min(count, maxCount) });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    showSwal("محصول با موفقیت به سبد خرید اضافه شد", "success", "فهمیدم");
  };

  const share = (network) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(product.name);
    const targets = {
      telegram: `https://t.me/share/url?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(targets[network], "_blank", "noopener,noreferrer");
  };

  return <main style={{ width: "63%" }}><Breadcrumb title={product.name} /><h2>{product.name}</h2><div className={styles.rating}><div>{Array.from({ length: starCount }).map((_, index) => <FaStar key={`on-${index}`} />)}{Array.from({ length: 5 - starCount }).map((_, index) => <FaRegStar key={`off-${index}`} />)}</div><p>(دیدگاه {product.comments?.length || 0} کاربر)</p></div><p className={styles.price}>{Number(product.price).toLocaleString()} تومان</p><span className={styles.description}>{product.shortDescription}</span><hr /><div className={styles.Available}><IoCheckmark /><p>{available ? (product.inventoryTracked ? `موجود در انبار، ${product.stock} عدد` : "موجود در انبار") : "ناموجود"}</p></div><div className={styles.cart}><button onClick={addToCart} disabled={!available}>{available ? "افزودن به سبد خرید" : "ناموجود"}</button><div><span onClick={() => setCount((value) => Math.max(1, value - 1))}>-</span>{count}<span onClick={() => setCount((value) => Math.min(maxCount, value + 1))}>+</span></div></div><section className={styles.wishlist}><AddToWishlist productID={product._id} /><div><TbSwitch3 /><span>مقایسه</span></div></section><hr /><div className={styles.details}><strong>شناسه محصول: {product.sku || product._id}</strong><p><strong>برچسب:</strong>{(product.tags || []).join("، ")}</p></div><div className={styles.share}><p>به اشتراک گذاری:</p><button type="button" onClick={() => share("telegram")} aria-label="Telegram"><FaTelegram /></button><button type="button" onClick={() => share("linkedin")} aria-label="LinkedIn"><FaLinkedinIn /></button><button type="button" onClick={() => share("pinterest")} aria-label="Pinterest"><FaPinterest /></button><button type="button" onClick={() => share("twitter")} aria-label="Twitter"><FaTwitter /></button><button type="button" onClick={() => share("facebook")} aria-label="Facebook"><FaFacebookF /></button></div><hr /></main>;
};
export default Details;
