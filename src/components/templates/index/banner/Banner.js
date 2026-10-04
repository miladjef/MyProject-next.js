"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

export default function Banner() {
  const images = ["/images/Home32.jpg", "/images/clubset1.jpg", "/images/coffee-image-1.jpg"];
  return <Swiper rewind navigation autoplay={{ delay: 3500 }} modules={[Navigation, Autoplay]} className="mySwiper home-slider">{images.map((src) => <SwiperSlide key={src}><img src={src} alt="بنر فروشگاه" /></SwiperSlide>)}</Swiper>;
}
