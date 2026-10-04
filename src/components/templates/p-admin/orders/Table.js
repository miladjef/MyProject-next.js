"use client";
import { useRouter } from "next/navigation";
import swal from "sweetalert";

const statusTitles = { PENDING: "در انتظار", PROCESSING: "در حال پردازش", SHIPPED: "ارسال شده", COMPLETED: "تکمیل شده", CANCELLED: "لغو شده" };
const paymentTitles = { UNPAID: "پرداخت نشده", PENDING: "در انتظار", PAID: "پرداخت شده", FAILED: "ناموفق", REFUNDED: "عودت شده" };

export default function OrdersTable({ orders }) {
  const router = useRouter();
  const update = async (order, field, value) => {
    const res = await fetch(`/api/orders/${order._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return swal({ title: data.message || "بروزرسانی انجام نشد", icon: "error", buttons: "فهمیدم" });
    router.refresh();
  };
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}><thead><tr><th>شماره سفارش</th><th>کاربر</th><th>مبلغ</th><th>وضعیت سفارش</th><th>پرداخت</th><th>تاریخ</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.user?.name || "کاربر حذف شده"}</td><td>{Number(order.total).toLocaleString()} تومان</td><td><select value={order.status} onChange={(e) => update(order, "status", e.target.value)}>{Object.entries(statusTitles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><select value={order.paymentStatus} onChange={(e) => update(order, "paymentStatus", e.target.value)}>{Object.entries(paymentTitles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td>{new Date(order.createdAt).toLocaleString("fa-IR")}</td></tr>)}</tbody></table></div>;
}
