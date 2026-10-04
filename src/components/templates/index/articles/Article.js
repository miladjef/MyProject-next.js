import { MdOutlineSms } from "react-icons/md";
import styles from "./article.module.css";
import Link from "next/link";

const Card = ({ article }) => {
  const date = new Date(article.publishedAt || article.createdAt || Date.now());
  return (
    <div className={styles.card}>
      <Link className={styles.img_container} href={`/article/${encodeURIComponent(article.slug)}`}>
        <img src={article.img || "/images/coffee-image-1.jpg"} alt={article.title} />
      </Link>
      <div className={styles.date}><span>{date.toLocaleDateString("fa-IR", { day: "numeric" })}</span><span>{date.toLocaleDateString("fa-IR", { month: "long" })}</span></div>
      <div className={styles.details}>
        <span className={styles.tag}>{article.tags?.[0] || "مقاله"}</span>
        <Link href={`/article/${encodeURIComponent(article.slug)}`} className={styles.title}>{article.title}</Link>
        <div><p>نویسنده</p><p>{article.author || "Milad Jafari Gavzan"}</p><div><MdOutlineSms /><span>0</span></div></div>
      </div>
    </div>
  );
};
export default Card;
