import AdminPanelLayout from "@/components/layouts/AdminPanelLayout";
import OrdersTable from "@/components/templates/p-admin/orders/Table";
import Pagination from "@/components/modules/pagination/Pagination";
import OrderModel from "@/models/Order";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }) {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");

  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = 50;
  const [orders, total] = await Promise.all([
    OrderModel.find({})
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments({}),
  ]);

  return (
    <AdminPanelLayout user={admin}>
      <main style={{ padding: 24, direction: "rtl" }}>
        <h1 style={{ marginBottom: 24 }}>سفارش‌ها</h1>
        <OrdersTable orders={JSON.parse(JSON.stringify(orders))} />
        <Pagination
          page={page}
          pages={Math.max(1, Math.ceil(total / limit))}
          basePath="/p-admin/orders"
        />
      </main>
    </AdminPanelLayout>
  );
}
