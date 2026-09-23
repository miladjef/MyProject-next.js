import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import Layout from "@/components/layouts/UserPanelLayout";
import styles from "@/styles/p-user/answerTicket.module.css";
import Link from "next/link";
import Answer from "@/components/templates/p-user/tickets/Answer";
import TicketModel from "@/models/Ticket";
import { authUser } from "@/utils/serverHelpers";

const Page = async ({ params }) => {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await authUser();
  if (!user) notFound();

  const ticket = await TicketModel.findOne({
    _id: id,
    user: user._id,
    isAnswer: false,
  })
    .populate("user", "name role")
    .lean();

  if (!ticket) notFound();

  const answers = await TicketModel.find({
    mainTicket: ticket._id,
    isAnswer: true,
  })
    .populate("user", "name role")
    .sort({ createdAt: 1 })
    .lean();

  return (
    <Layout>
      <main className={styles.container}>
        <h1 className={styles.title}>
          <span>{ticket.title}</span>
          <Link href="/p-user/tickets/sendTicket">ارسال تیکت جدید</Link>
        </h1>
        <div>
          <Answer type="user" {...JSON.parse(JSON.stringify(ticket))} />
          {answers.map((answer) => (
            <Answer
              key={String(answer._id)}
              type={answer.user?.role === "ADMIN" ? "admin" : "user"}
              {...JSON.parse(JSON.stringify(answer))}
            />
          ))}
          {answers.length === 0 && (
            <div className={styles.empty}>
              <p>هنوز پاسخی دریافت نکردید</p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Page;
