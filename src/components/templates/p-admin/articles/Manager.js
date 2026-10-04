"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import swal from "sweetalert";

const emptyForm = { title: "", slug: "", excerpt: "", body: "", tags: "", status: "DRAFT" };

export default function Manager({ articles }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [img, setImg] = useState(null);
  const [editingId, setEditingId] = useState("");
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyForm);
    setImg(null);
    setEditingId("");
  };

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      return swal({ title: "عنوان و متن مقاله را کامل کنید", icon: "error", buttons: "فهمیدم" });
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (img) data.append("img", img);
    const res = await fetch(editingId ? `/api/articles/${editingId}` : "/api/articles", {
      method: editingId ? "PATCH" : "POST",
      body: data,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "ذخیره مقاله انجام نشد", icon: "error", buttons: "فهمیدم" });
    reset();
    await swal({ title: editingId ? "مقاله ویرایش شد" : "مقاله ثبت شد", icon: "success", buttons: "فهمیدم" });
    router.refresh();
  };

  const startEdit = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      body: article.body || "",
      tags: (article.tags || []).join("، "),
      status: article.status || "DRAFT",
    });
    setImg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    const ok = await swal({ title: "مقاله حذف شود؟", icon: "warning", buttons: ["خیر", "بله"] });
    if (!ok) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "حذف مقاله انجام نشد", icon: "error", buttons: "فهمیدم" });
    router.refresh();
  };

  const toggle = async (article) => {
    const res = await fetch(`/api/articles/${article._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <main style={{ direction: "rtl", padding: 24 }}>
      <h1>مقالات</h1>
      <section style={{ display: "grid", gap: 10, maxWidth: 800, marginTop: 20 }}>
        <input placeholder="عنوان" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <input placeholder="اسلاگ اختیاری" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        <input placeholder="خلاصه" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        <textarea rows={8} placeholder="متن مقاله" value={form.body} onChange={(e) => set("body", e.target.value)} />
        <input placeholder="برچسب‌ها" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        <select value={form.status} onChange={(e) => set("status", e.target.value)}>
          <option value="DRAFT">پیش نویس</option>
          <option value="PUBLISHED">منتشر شده</option>
        </select>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImg(e.target.files?.[0] || null)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={submit}>{editingId ? "ذخیره ویرایش" : "ثبت مقاله"}</button>
          {editingId && <button type="button" onClick={reset}>انصراف</button>}
        </div>
      </section>
      <div style={{ marginTop: 30, display: "grid", gap: 10 }}>
        {articles.map((article) => (
          <div key={article._id} style={{ background: "#fff", padding: 12, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <span>{article.title}، {article.status}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => startEdit(article)}>ویرایش</button>
              <button type="button" onClick={() => toggle(article)}>{article.status === "PUBLISHED" ? "پیش نویس" : "انتشار"}</button>
              <button type="button" onClick={() => remove(article._id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
