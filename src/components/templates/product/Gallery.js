"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { useState } from "react";

const Gallery = ({ product }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const images = [
    ...(product?.img ? [{ url: product.img, alt: product.imgAlt || product.name }] : []),
    ...((product?.gallery || []).filter((entry) => entry?.url)),
  ];
  if (!images.length) images.push({ url: "/images/product.png", alt: product?.name || "محصول" });
  return <section style={{ width: "36%" }}><Swiper style={{ "--swiper-navigation-color": "#fff", "--swiper-pagination-color": "#fff" }} spaceBetween={10} navigation thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }} modules={[FreeMode, Navigation, Thumbs]} className="mySwiper2 gallery-slider">{images.map((entry) => <SwiperSlide key={entry.url}><img src={entry.url} alt={entry.alt || product?.name || "محصول"} /></SwiperSlide>)}</Swiper>{images.length > 1 && <Swiper onSwiper={setThumbsSwiper} spaceBetween={10} slidesPerView={4} freeMode watchSlidesProgress modules={[FreeMode, Navigation, Thumbs]} className="gallery-slider-2">{images.map((entry) => <SwiperSlide key={entry.url}><img src={entry.url} alt={entry.alt || product?.name || "محصول"} /></SwiperSlide>)}</Swiper>}</section>;
};
export default Gallery;
