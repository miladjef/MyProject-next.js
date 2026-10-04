import styles from "./footer.module.css";
import { MdOutlineCopyright } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import Article from "./Article";
import Link from "next/link";
import { getLatestArticles } from "@/utils/publicData";

const Footer = async () => {
  const articles = await getLatestArticles(2);
  const siteName = process.env.SITE_NAME || "فروشگاه قهوه";
  const siteAddress = process.env.SITE_ADDRESS || "";
  const sitePhone = process.env.SITE_PHONE || "";
  const siteEmail = process.env.SITE_EMAIL || "";
  return <footer className={styles.footer}><main className="container"><section className={styles.descriptions}><img src="/images/logo_light.png" alt={siteName}/><p className={styles.descriptions_title}>{siteName}</p>{siteAddress&&<div className={styles.description}><FaRegHeart style={{fontSize:"2rem"}}/><p>{siteAddress}</p></div>}{sitePhone&&<div className={styles.description}><FaRegHeart/><p>پیگیری سفارشات: {sitePhone}</p></div>}{siteEmail&&<div className={styles.description}><FaRegHeart/><p>{siteEmail}</p></div>}</section><section><h4>جدیدترین نوشته ها</h4>{articles.map((a,index)=><div key={String(a._id)}><Article href={`/article/${a.slug}`} comments="" date={new Date(a.publishedAt||a.createdAt).toLocaleDateString("fa-IR")} img={a.img||"/images/coffee-image-1.jpg"} title={a.title}/>{index===0&&articles.length>1&&<hr/>}</div>)}</section><ul className={styles.links}><div><h4>منوی فوتر</h4><li><Link href="/contact-us">تماس با ما</Link></li><li><Link href="/about-us">درباره ما</Link></li><li><Link href="/rules">قوانین</Link></li></div><div><h4>دسترسی سریع</h4><li><Link href="/category">فروشگاه</Link></li><li><Link href="/articles">مقالات</Link></li><li><Link href="/cart">سبد خرید</Link></li><li><Link href="/wishlist">علاقه مندی ها</Link></li></div></ul><div className={styles.licenses}><img src="/images/license4.htm" width={76} height={76} alt=""/><img src="/images/license1.png" width={85} height={85} alt=""/><img src="/images/license3.png" alt=""/><img src="/images/license2.svg" width={62} height={95} alt=""/></div></main><hr/><div className="container"><p className={styles.copyRight}>{new Date().getFullYear()} <MdOutlineCopyright/> تمام حقوق متعلق است به <strong>{siteName}</strong> | برنامه نویس <strong>Milad Jafari Gavzan</strong></p></div></footer>;
};
export default Footer;
