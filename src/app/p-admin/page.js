import React from "react";
import AdminPanelLayout from "@/components/layouts/AdminPanelLayout";

import styles from "@/styles/p-admin/index.module.css";
import Box from "@/components/modules/infoBox/InfoBox";
import SaleChart from "@/components/templates/p-admin/index/SaleChart";
import GrowthChart from "@/components/templates/p-admin/index/GrowthChart";

import TicketModel from "@/models/Ticket";
import CommentModel from "@/models/Comment";
import UserModel from "@/models/User";
import ProductModel from "@/models/Product";
import connectToDB from "@/configs/db";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

async function AdminHomePage() {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  await connectToDB();
  const [ticketCount, userCount, productCount] = await Promise.all([
    TicketModel.countDocuments({}),
    UserModel.countDocuments({}),
    ProductModel.countDocuments({}),
  ]);

  return (
    <AdminPanelLayout>
      <main>
        <section className={styles.dashboard_contents}>
          <Box title="مجموع تیکت های دریافتی" value={ticketCount} />
          <Box title="مجموع محصولات سایت" value={productCount} />
          <Box title="مجموع سفارشات" value="333" />
          <Box title="مجموع کاربر های سایت" value={userCount} />
        </section>{" "}
        <div className={styles.dashboard_charts}>
          <section>
            <p>آمار فروش</p>
            <SaleChart />
          </section>
          <section>
            <p>نرخ رشد</p>
            <GrowthChart />
          </section>
        </div>
      </main>
    </AdminPanelLayout>
  );
}

export default AdminHomePage;
