import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  haversineMeters,
  isSamePosition,
  lerpLatLng,
} from "@chowgo/shared/geo";

const FALLBACK_CENTER = [44.8176, 20.4633];

const SNAP_THRESHOLD_M = 500;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function KeepSizeInSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const raf = requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(raf);
    }

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function SmoothMarker({ position, icon, tooltip, durationMs = 1000 }) {
  const map = useMap();
  const markerRef = useRef(null);
  const frameRef = useRef(null);
  const renderedRef = useRef(null);

  const lat = position?.[0];
  const lng = position?.[1];

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      renderedRef.current = null;
    },
    [map],
  );

  useEffect(() => {
    if (lat == null || lng == null) {
      cancelAnimationFrame(frameRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      renderedRef.current = null;
      return;
    }

    const target = [lat, lng];

    if (!markerRef.current) {
      const marker = L.marker(target, { icon }).addTo(map);
      if (tooltip) {
        marker.bindTooltip(tooltip, {
          direction: "top",
          offset: [0, -24],
          opacity: 0.92,
        });
      }
      markerRef.current = marker;
      renderedRef.current = target;
      return;
    }

    const marker = markerRef.current;
    const from = renderedRef.current;

    if (
      !from ||
      prefersReducedMotion() ||
      haversineMeters(from, target) > SNAP_THRESHOLD_M ||
      isSamePosition(from, target)
    ) {
      renderedRef.current = target;
      marker.setLatLng(target);
      return;
    }

    cancelAnimationFrame(frameRef.current);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t * (2 - t);
      const next = lerpLatLng(from, target, eased);
      marker.setLatLng(next);
      renderedRef.current = next;

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        renderedRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [map, lat, lng, icon, tooltip, durationMs]);

  return null;
}

function FollowCourier({ coords, enabled }) {
  const map = useMap();
  const hasCentred = useRef(false);
  const wasEnabled = useRef(false);

  useEffect(() => {
    if (!coords) return;

    const justEnabled = enabled && !wasEnabled.current;
    wasEnabled.current = enabled;

    if (!enabled) {
      if (!hasCentred.current) {
        map.setView(coords, 15);
        hasCentred.current = true;
      }
      return;
    }

    if (justEnabled || !hasCentred.current) {
      map.setView(coords, Math.max(map.getZoom(), 16), { animate: true });
      hasCentred.current = true;
      return;
    }

    map.panTo(coords, { animate: true, duration: 0.9, easeLinearity: 0.5 });
  }, [map, coords, enabled]);

  return null;
}

function FitAllPoints({ points, enabled }) {
  const map = useMap();
  const fittedCount = useRef(0);

  const valid = points.filter(Boolean);
  const count = valid.length;

  useEffect(() => {
    if (enabled || count === 0 || count === fittedCount.current) return;
    fittedCount.current = count;

    if (count === 1) {
      map.setView(valid[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(valid), { padding: [48, 48], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, count, enabled]);

  return null;
}

function MapInner({
  restaurantCoords,
  deliveryCoords,
  courierCoords,
  routeCoords,
  followCourier,
  isDark,
}) {
  const [initialCenter] = useState(
    () => courierCoords ?? restaurantCoords ?? deliveryCoords ?? FALLBACK_CENTER,
  );

  const points = useMemo(
    () => [restaurantCoords, deliveryCoords, courierCoords],
    [restaurantCoords, deliveryCoords, courierCoords],
  );

  return (
    <MapContainer
      center={initialCenter}
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
      <SmoothMarker
        position={courierCoords}
        icon={courierIcon}
        tooltip="Courier (live)"
      />

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

      <KeepSizeInSync />
      {courierCoords && (
        <FollowCourier coords={courierCoords} enabled={followCourier} />
      )}
      <FitAllPoints points={points} enabled={followCourier} />
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
      />
    </div>
  );
}
