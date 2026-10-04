"use client";
import { useEffect, useState } from "react";
import styles from "./articles.module.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";
import Article from "./Article";

const Articles = () => {
  const [articles, setArticles] = useState([]);
  useEffect(() => { fetch("/api/articles?limit=12", { cache: "no-store" }).then((r) => r.ok ? r.json() : { items: [] }).then((d) => setArticles(d.items || [])).catch(() => setArticles([])); }, []);
  if (!articles.length) return null;
  return <div className={styles.container}><p className={styles.title}>مقالات ما</p><span className={styles.description}>دانستنی های دنیای قهوه</span><main><Swiper slidesPerView={3} spaceBetween={30} dir="rtl" autoplay={{ delay: 3500, disableOnInteraction: false }} loop={articles.length > 3} navigation modules={[Navigation, Autoplay]} className="mySwiper articles_slider">{articles.map((article) => <SwiperSlide key={article._id}><Article article={article} /></SwiperSlide>)}</Swiper></main></div>;
};
export default Articles;
