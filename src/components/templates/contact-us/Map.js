"use client";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 320, display: "grid", placeItems: "center" }}>در حال بارگذاری نقشه...</div>,
});

export default function Map(props) {
  return <MapInner {...props} />;
}
