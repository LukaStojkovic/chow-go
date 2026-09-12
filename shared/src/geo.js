/**
 * Map and routing geometry.
 *
 * `formatDistance` here deliberately differs from the one in `format.js`:
 * a route length is a measurement and is shown as measured, while a discovery
 * card buckets to 50 m so two restaurants on one street do not look ranked by
 * a metre. The two must never be merged behind a barrel export.
 */

import { t } from "./i18n/index.js";

export function toLatLng(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng === 0 && lat === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export function toOsrmCoord(latLng) {
  if (!latLng) return null;
  const [lat, lng] = latLng;
  return `${lng},${lat}`;
}

export function formatDistance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return t("common:units.metres", { value: Math.round(meters) });
  return t("common:units.kilometres", { value: (meters / 1000).toFixed(1) });
}

export function formatDuration(seconds) {
  if (seconds == null) return null;
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return t("common:units.minutes", { value: mins });
  return t("common:units.hoursMinutes", {
    hours: Math.floor(mins / 60),
    minutes: mins % 60,
  });
}

export function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function lerpLatLng(from, to, t) {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

export function isSamePosition(a, b) {
  if (!a || !b) return a === b;
  return haversineMeters(a, b) < 1;
}
