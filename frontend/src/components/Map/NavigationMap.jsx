import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  TILE_ATTRIBUTION,
  TILE_DARK,
  TILE_LIGHT,
} from "@/constants/mapConstants";
import {
  courierIcon,
  deliveryIcon,
  restaurantIcon,
} from "@/components/Map/mapIcons";

function FollowCourier({ coords, enabled }) {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!coords) return;
    if (enabled) {
      map.setView(coords, Math.max(map.getZoom(), 16), { animate: true });
      initialized.current = true;
    } else if (!initialized.current) {
      map.setView(coords, 15);
      initialized.current = true;
    }
  }, [map, coords, enabled]);

  return null;
}

function FitAllPoints({ points, enabled }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    if (enabled || didFit.current) return;
    const valid = points.filter(Boolean);
    if (valid.length >= 2) {
      map.fitBounds(L.latLngBounds(valid), { padding: [48, 48], maxZoom: 16 });
      didFit.current = true;
    } else if (valid.length === 1) {
      map.setView(valid[0], 15);
      didFit.current = true;
    }
  }, [map, points, enabled]);

  return null;
}

function MapInner({
  restaurantCoords,
  deliveryCoords,
  courierCoords,
  routeCoords,
  followCourier,
  isDark,
  fitPoints,
}) {
  const center =
    courierCoords ?? restaurantCoords ?? deliveryCoords ?? [44.8176, 20.4633];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={isDark ? TILE_DARK : TILE_LIGHT}
        attribution={TILE_ATTRIBUTION}
      />

      {restaurantCoords && (
        <Marker position={restaurantCoords} icon={restaurantIcon}>
          <Tooltip direction="top" offset={[0, -24]} opacity={0.92}>
            Restaurant pickup
          </Tooltip>
        </Marker>
      )}
      {deliveryCoords && (
        <Marker position={deliveryCoords} icon={deliveryIcon}>
          <Tooltip direction="top" offset={[0, -24]} opacity={0.92}>
            Delivery location
          </Tooltip>
        </Marker>
      )}
      {courierCoords && (
        <Marker position={courierCoords} icon={courierIcon}>
          <Tooltip direction="top" offset={[0, -24]} opacity={0.92}>
            Courier (live)
          </Tooltip>
        </Marker>
      )}

      {routeCoords?.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: "#3b82f6",
            weight: 5,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {restaurantCoords && deliveryCoords && !routeCoords && (
        <Polyline
          positions={[restaurantCoords, deliveryCoords]}
          pathOptions={{
            color: "#10b981",
            weight: 2,
            dashArray: "6 6",
            opacity: 0.45,
            lineCap: "round",
          }}
        />
      )}

      {courierCoords && (
        <FollowCourier coords={courierCoords} enabled={followCourier} />
      )}
      <FitAllPoints
        points={[restaurantCoords, deliveryCoords, courierCoords]}
        enabled={followCourier}
      />
    </MapContainer>
  );
}

export function NavigationMap({
  restaurantCoords,
  deliveryCoords,
  courierCoords,
  routeCoords,
  followCourier = false,
  className = "absolute inset-0",
}) {
  const { isDark } = useDarkMode();

  return (
    <div className={className}>
      <MapInner
        restaurantCoords={restaurantCoords}
        deliveryCoords={deliveryCoords}
        courierCoords={courierCoords}
        routeCoords={routeCoords}
        followCourier={followCourier}
        isDark={isDark}
        fitPoints={[restaurantCoords, deliveryCoords, courierCoords]}
      />
    </div>
  );
}
