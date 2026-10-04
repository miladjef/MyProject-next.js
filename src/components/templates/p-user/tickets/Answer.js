import styles from "./answer.module.css";

const Answer = ({ type, body, createdAt, user, attachment }) => (
  <section className={type === "user" ? styles.userTicket : styles.adminticket}>
    <div className={styles.ticket_main}><p>{new Date(createdAt).toLocaleDateString("fa-IR")}</p><div><div><p>{user?.name || (type === "user" ? "کاربر" : "مدیر")}</p><span>{type === "user" ? "کاربر" : "مدیر"}</span></div><img src="/images/logo.png" alt="" /></div></div>
    <div className={styles.ticket_text}><p>{body}</p>{attachment && <p style={{marginTop:12}}><a href={attachment} target="_blank" rel="noreferrer">مشاهده پیوست</a></p>}</div>
  </section>
);
export default Answer;
