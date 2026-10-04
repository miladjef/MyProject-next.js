import Link from "next/link";
import styles from "./order.module.css";

const statusTitle = {
  PENDING: "در انتظار بررسی",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
};

const Order = ({ order }) => {
  const firstItem = order.items?.[0];
  return (
    <Link href={`/p-user/orders?order=${order._id}`} className={styles.card}>
      <div>
        <div>
          <p>{firstItem?.name || order.orderNumber}</p>
          {firstItem?.img && <img src={firstItem.img} alt={firstItem.name || ""} />}
        </div>
        <p>{statusTitle[order.status] || order.status}</p>
      </div>
      <div>
        <p>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</p>
        <p className={styles.price}>{Number(order.total || 0).toLocaleString()} تومان</p>
      </div>
    </Link>
  );
};

export default Order;
