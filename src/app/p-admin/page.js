import React from "react";
import AdminPanelLayout from "@/components/layouts/AdminPanelLayout";

import styles from "@/styles/p-admin/index.module.css";
import Box from "@/components/modules/infoBox/InfoBox";
import SaleChart from "@/components/templates/p-admin/index/SaleChart";
import GrowthChart from "@/components/templates/p-admin/index/GrowthChart";

import TicketModel from "@/models/Ticket";
import UserModel from "@/models/User";
import ProductModel from "@/models/Product";
import OrderModel from "@/models/Order";
import connectToDB from "@/configs/db";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

async function AdminHomePage() {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  await connectToDB();
  const dayMs = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(Date.now() - 6 * dayMs);
  const fourteenDaysAgo = new Date(Date.now() - 13 * dayMs);
  const [ticketCount, userCount, productCount, orderCount, sales, recentUsers] = await Promise.all([
    TicketModel.countDocuments({ isAnswer: false }),
    UserModel.countDocuments({ isDeleted: false }),
    ProductModel.countDocuments({}),
    OrderModel.countDocuments({}),
    OrderModel.find({ createdAt: { $gte: sevenDaysAgo }, status: { $ne: "CANCELLED" } }).select("total createdAt").lean(),
    UserModel.find({ createdAt: { $gte: fourteenDaysAgo }, isDeleted: false }).select("createdAt").lean(),
  ]);
  const salesMap = new Map();
  for (let i = 0; i < 7; i++) { const d = new Date(sevenDaysAgo.getTime() + i * 86400000); salesMap.set(d.toISOString().slice(0, 10), 0); }
  for (const order of sales) { const key = new Date(order.createdAt).toISOString().slice(0, 10); salesMap.set(key, (salesMap.get(key) || 0) + Number(order.total || 0)); }
  const salesData = [...salesMap.entries()].map(([date, sale]) => ({ date, sale }));

  const signupByDay = new Map();
  for (const item of recentUsers) {
    const key = new Date(item.createdAt).toISOString().slice(0, 10);
    signupByDay.set(key, (signupByDay.get(key) || 0) + 1);
  }
  const growthData = Array.from({ length: 7 }).map((_, index) => {
    const currentDate = new Date(sevenDaysAgo.getTime() + index * dayMs);
    const previousDate = new Date(currentDate.getTime() - 7 * dayMs);
    return {
      name: currentDate.toISOString().slice(5, 10),
      current: signupByDay.get(currentDate.toISOString().slice(0, 10)) || 0,
      prev: signupByDay.get(previousDate.toISOString().slice(0, 10)) || 0,
    };
  });

  return (
    <AdminPanelLayout user={admin}>
      <main>
        <section className={styles.dashboard_contents}>
          <Box title="مجموع تیکت های دریافتی" value={ticketCount} />
          <Box title="مجموع محصولات سایت" value={productCount} />
          <Box title="مجموع سفارشات" value={orderCount} />
          <Box title="مجموع کاربر های سایت" value={userCount} />
        </section>{" "}
        <div className={styles.dashboard_charts}>
          <section>
            <p>آمار فروش</p>
            <SaleChart data={salesData} />
          </section>
          <section>
            <p>نرخ رشد</p>
            <GrowthChart data={growthData} />
          </section>
        </div>
      </main>
    </AdminPanelLayout>
  );
}

export default AdminHomePage;
