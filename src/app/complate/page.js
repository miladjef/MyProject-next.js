import Navbar from "@/components/modules/navbar/Navbar";
import Footer from "@/components/modules/footer/Footer";
import Stepper from "@/components/modules/stepper/Stepper";
import { authUser } from "@/utils/serverHelpers";
import OrderModel from "@/models/Order";
import { isValidObjectId } from "mongoose";
import Link from "next/link";

export default async function Page({ searchParams }) {
  const user = await authUser();
  const params = await searchParams;
  const orderId = String(params?.order || "");
  let order = null;
  if (user && isValidObjectId(orderId)) {
    order = await OrderModel.findOne({ _id: orderId, user: user._id }).lean();
  }

  return (
    <>
      <Navbar isLogin={Boolean(user)} />
      <Stepper step="complate" />
      <main className="container" style={{ padding: "50px 20px", direction: "rtl" }}>
        {order ? (
          <>
            <h1>سفارش ثبت شد</h1>
            <p style={{ marginTop: 20 }}>شماره سفارش: {order.orderNumber}</p>
            <p style={{ marginTop: 10 }}>مبلغ: {Number(order.total).toLocaleString()} تومان</p>
            <p style={{ marginTop: 10 }}>وضعیت سفارش: {order.status}</p>
            <p style={{ marginTop: 10 }}>وضعیت پرداخت: {order.paymentStatus}</p>
            <p style={{ marginTop: 20 }}><Link href="/p-user/orders">مشاهده سفارش‌ها</Link></p>
          </>
        ) : (
          <>
            <h1>اطلاعات سفارش پیدا نشد</h1>
            <p style={{ marginTop: 20 }}><Link href="/p-user/orders">مشاهده سفارش‌ها</Link></p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
