import { FaRegStar, FaStar } from "react-icons/fa";
import styles from "./comment.module.css";

const Comment = ({ username, body, score, date, createdAt, adminReply }) => {
  const numericScore = Math.max(0, Math.min(5, Number(score) || 0));
  const shownDate = date || createdAt;
  return (
    <section className={styles.comment}>
      <img src="/images/shahin.jpg" className={styles.avatar} alt="" />
      <div>
        <div className={styles.main_details}>
          <div className={styles.user_info}>
            <strong>{username}</strong>
            <p>{shownDate ? new Date(shownDate).toLocaleDateString("fa-IR") : ""}</p>
          </div>
          <div className={styles.stars}>
            {Array.from({ length: numericScore }).map((_, index) => <FaStar key={`on-${index}`} />)}
            {Array.from({ length: 5 - numericScore }).map((_, index) => <FaRegStar key={`off-${index}`} />)}
          </div>
        </div>
        <p>{body}</p>
        {adminReply && (
          <div style={{ marginTop: 12, padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
            <strong>پاسخ مدیریت</strong>
            <p>{adminReply}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Comment;
