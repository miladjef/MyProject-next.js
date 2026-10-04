"use client";
import styles from "./table.module.css";
import { useRouter } from "next/navigation";
import swal from "sweetalert";
import { showAdminForm } from "@/utils/adminDialog";

export default function DataTable({ products, title }) {
  const router = useRouter();
  const edit = async (product) => {
    const values = await showAdminForm({ title: "ویرایش محصول", fields: [
      { name: "name", label: "نام محصول", value: product.name },
      { name: "price", label: "قیمت", value: String(product.price), type: "number" },
      { name: "stock", label: "موجودی", value: String(product.stock ?? 0), type: "number" },
      { name: "status", label: "وضعیت", value: product.status || "ACTIVE", type: "select", options: [
        { value: "ACTIVE", label: "فعال" }, { value: "DRAFT", label: "پیش نویس" }, { value: "ARCHIVED", label: "آرشیو" },
      ] },
    ] });
    if (!values) return;
    const res = await fetch(`/api/products/${product._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.name, price: Number(values.price), stock: Number(values.stock), status: values.status }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "ویرایش انجام نشد", icon: "error", buttons: "فهمیدم" });
    router.refresh();
  };

  const remove = (product) => swal({ title: `محصول «${product.name}» آرشیو شود؟`, icon: "warning", buttons: ["خیر", "بله"] }).then(async (ok) => {
    if (!ok) return;
    const res = await fetch(`/api/products/${product._id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: body.message || "آرشیو انجام نشد", icon: "error", buttons: "فهمیدم" });
    router.refresh();
  });

  return <div><div><h1 className={styles.title}><span>{title}</span></h1></div><div className={styles.table_container}><table className={styles.table}><thead><tr><th>شناسه</th><th>نام</th><th>SKU</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>جزئیات</th><th>ویرایش</th><th>آرشیو</th></tr></thead><tbody>{products.map((product, index) => <tr key={product._id}><td>{index + 1}</td><td>{product.name}</td><td>{product.sku || "-"}</td><td>{Number(product.price).toLocaleString()}</td><td>{product.inventoryTracked ? product.stock : "بدون کنترل"}</td><td>{product.status || "ACTIVE"}</td><td><button type="button" className={styles.edit_btn} onClick={() => window.open(`/product/${product.slug || product._id}`, "_blank", "noopener,noreferrer")}>مشاهده</button></td><td><button type="button" className={styles.edit_btn} onClick={() => edit(product)}>ویرایش</button></td><td><button type="button" className={styles.delete_btn} onClick={() => remove(product)}>آرشیو</button></td></tr>)}</tbody></table></div></div>;
}
