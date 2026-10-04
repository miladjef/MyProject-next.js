"use client";
import React, { useState } from "react";
import styles from "./table.module.css";
import swal from "sweetalert";
import { useRouter } from "next/navigation";

function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", slug: "", sku: "", category: "", brand: "", price: "", stock: "0", inventoryTracked: false,
    shortDescription: "", longDescription: "", weight: "", suitableFor: "", smell: "", tags: "", status: "ACTIVE", imgAlt: "",
  });
  const [img, setImg] = useState(null);
  const [gallery, setGallery] = useState([]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addProduct = async () => {
    if (!form.name.trim() || !form.price || !form.shortDescription.trim() || !form.longDescription.trim() || !form.weight || !form.suitableFor.trim() || !form.smell.trim() || !form.tags.trim() || !img) {
      return swal({ title: "همه فیلدهای ضروری را کامل کنید", icon: "error", buttons: "فهمیدم" });
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    data.append("img", img);
    gallery.slice(0, 8).forEach((file) => data.append("gallery", file));
    const res = await fetch("/api/products", { method: "POST", body: data });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "ثبت محصول انجام نشد", icon: "error", buttons: "فهمیدم" });
    swal({ title: "محصول با موفقیت ایجاد شد", icon: "success", buttons: "فهمیدم" }).then(() => router.refresh());
  };

  return (
    <section className={styles.discount}>
      <p>افزودن محصول جدید</p>
      <div className={styles.discount_main}>
        <div><label>نام محصول</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label>Slug اختیاری</label><input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="در صورت خالی بودن خودکار تولید می شود" /></div>
        <div><label>SKU</label><input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
        <div><label>دسته بندی</label><input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div><label>برند</label><input value={form.brand} onChange={(e) => set("brand", e.target.value)} /></div>
        <div><label>مبلغ محصول</label><input inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} /></div>
        <div><label>موجودی</label><input inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} /></div>
        <div><label>کنترل موجودی</label><input type="checkbox" checked={form.inventoryTracked} onChange={(e) => set("inventoryTracked", e.target.checked)} /></div>
        <div><label>وضعیت</label><select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="ACTIVE">فعال</option><option value="DRAFT">پیش نویس</option><option value="ARCHIVED">آرشیو</option></select></div>
        <div><label>توضیحات کوتاه</label><input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></div>
        <div><label>توضیحات بلند</label><textarea value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} rows={5} /></div>
        <div><label>وزن</label><input inputMode="decimal" value={form.weight} onChange={(e) => set("weight", e.target.value)} /></div>
        <div><label>مناسب برای</label><input value={form.suitableFor} onChange={(e) => set("suitableFor", e.target.value)} /></div>
        <div><label>میزان بو</label><input value={form.smell} onChange={(e) => set("smell", e.target.value)} /></div>
        <div><label>تگ های محصول</label><input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="قهوه، اسپرسو" /></div>
        <div><label>متن جایگزین تصویر</label><input value={form.imgAlt} onChange={(e) => set("imgAlt", e.target.value)} /></div>
        <div><label>تصویر شاخص</label><input accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImg(e.target.files?.[0] || null)} type="file" /></div>
        <div><label>گالری، حداکثر ۸ تصویر</label><input multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setGallery(Array.from(e.target.files || []).slice(0, 8))} type="file" /></div>
      </div>
      <button type="button" onClick={addProduct}>افزودن</button>
    </section>
  );
}
export default AddProduct;
