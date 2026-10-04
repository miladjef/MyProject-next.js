import Layout from "@/components/layouts/UserPanelLayout";
import styles from "@/styles/p-user/index.module.css";
import Box from "@/components/modules/infoBox/InfoBox";
import Tickets from "@/components/templates/p-user/index/Tickets";
import Orders from "@/components/templates/p-user/index/Orders";
import { authUser } from "@/utils/serverHelpers";
import TicketModel from "@/models/Ticket";
import CommentModel from "@/models/Comment";
import WishlistModel from "@/models/Wishlist";
import OrderModel from "@/models/Order";
import { redirect } from "next/navigation";

const page = async () => {
  const user = await authUser();
  if (!user) redirect("/login-register");
  const tickets = await TicketModel.find({ user: user._id })
    .limit(3)
    .populate("department", "title")
    .sort({ _id: -1 })
    .lean();

  const allTickets = await TicketModel.find({ user: user._id });
  const comments = await CommentModel.find({
    $or: [{ user: user._id }, ...(user.email ? [{ email: user.email }] : [])],
  });
  const wishes = await WishlistModel.find({ user: user._id });
  const [orderCount, recentOrders] = await Promise.all([
    OrderModel.countDocuments({ user: user._id }),
    OrderModel.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  return (
    <Layout user={user}>
      <main>
        <section className={styles.boxes}>
          <Box title="مجموع تیکت ها " value={allTickets.length} />
          <Box title="مجموع کامنت ها " value={comments.length} />
          <Box title="مجموع سفارشات" value={orderCount} />
          <Box title="مجموع علاقه مندی ها" value={wishes.length} />
        </section>
        <section className={styles.contents}>
          <Tickets tickets={JSON.parse(JSON.stringify(tickets))} />
          <Orders orders={JSON.parse(JSON.stringify(recentOrders))} />
        </section>
      </main>
    </Layout>
  );
};

export default page;
