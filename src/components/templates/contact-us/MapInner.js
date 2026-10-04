"use client";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./map.module.css";

const markerIcon = L.icon({
  iconUrl: "/images/map-marker.svg",
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -42],
});

export default function MapInner({ position, center, children }) {
  return (
    <>
      <MapContainer className={styles.map} center={center} zoom={14} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} icon={markerIcon}><Popup>فروشگاه</Popup></Marker>
      </MapContainer>
      <div className={styles.details}>{children}</div>
    </>
  );
}
