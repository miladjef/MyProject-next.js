import UserPanelLayout from "@/components/layouts/UserPanelLayout";
import Pagination from "@/components/modules/pagination/Pagination";
import { authUser } from "@/utils/serverHelpers";
import OrderModel from "@/models/Order";
import { redirect } from "next/navigation";

const statusTitle = {
  PENDING: "در انتظار بررسی",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
};

const paymentTitle = {
  UNPAID: "پرداخت نشده",
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  REFUNDED: "عودت شده",
};

export default async function Page({ searchParams }) {
  const user = await authUser();
  if (!user) redirect("/login-register");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = 20;
  const filter = { user: user._id };
  const [orders, total] = await Promise.all([
    OrderModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    OrderModel.countDocuments(filter),
  ]);

  return (
    <UserPanelLayout>
      <main style={{ direction: "rtl", padding: 30 }}>
        <h1>سفارش‌ها</h1>
        {!orders.length ? <p style={{ marginTop: 24 }}>هنوز سفارشی ثبت نشده است.</p> : (
          <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
            {orders.map((order) => (
              <article key={String(order._id)} style={{ background: "#fff", padding: 18, borderRadius: 8 }}>
                <h3>{order.orderNumber}</h3>
                <p>وضعیت سفارش: {statusTitle[order.status] || order.status}</p>
                <p>وضعیت پرداخت: {paymentTitle[order.paymentStatus] || order.paymentStatus}</p>
                <p>مبلغ: {Number(order.total).toLocaleString()} تومان</p>
                <p>تاریخ: {new Date(order.createdAt).toLocaleString("fa-IR")}</p>
                <div style={{ marginTop: 10 }}>
                  {order.items.map((item, index) => <p key={`${String(item.product)}-${index}`}>{item.name} × {item.count}</p>)}
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} pages={Math.max(1, Math.ceil(total / limit))} basePath="/p-user/orders" />
      </main>
    </UserPanelLayout>
  );
}
