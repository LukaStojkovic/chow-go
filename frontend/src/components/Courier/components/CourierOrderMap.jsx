import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  TILE_ATTRIBUTION,
  TILE_DARK,
  TILE_LIGHT,
} from "@/constants/mapConstants";

const redPinIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2.5px solid #fff;box-shadow:0 0 0 2px #ef4444;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const greenDotIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid #fff;box-shadow:0 0 0 2px #10b981;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

function MapInner({ restaurantCoords, deliveryCoords, isDark }) {
  const positions = [restaurantCoords, deliveryCoords];
  return (
    <MapContainer
      center={restaurantCoords}
      zoom={13}
      scrollWheelZoom
      zoomControl
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={isDark ? TILE_DARK : TILE_LIGHT}
        attribution={TILE_ATTRIBUTION}
      />
      <Marker position={restaurantCoords} icon={greenDotIcon} />
      <Marker position={deliveryCoords} icon={redPinIcon} />
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#10b981",
          weight: 3,
          dashArray: "8 6",
          lineCap: "round",
        }}
      />
      <FitBounds positions={positions} />
    </MapContainer>
  );
}

export function CourierOrderMap({
  restaurantCoords,
  deliveryCoords,
  distanceKm,
  deliveryDistance,
}) {
  const { isDark } = useDarkMode();
  const etaMin = deliveryDistance
    ? Math.round((deliveryDistance / 1000) * 3.5)
    : null;

  return (
    <div className="h-52 w-full relative">
      <MapInner
        restaurantCoords={restaurantCoords}
        deliveryCoords={deliveryCoords}
        isDark={isDark}
      />
      {distanceKm && (
        <div className="absolute left-3 bottom-3 z-999 flex items-center gap-1.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border px-2.5 py-1.5 text-xs font-medium shadow-sm">
          <Clock className="h-3.5 w-3.5 text-emerald-500" />
          {distanceKm} km{etaMin ? ` · ~${etaMin} min` : ""}
        </div>
      )}
    </div>
  );
}
