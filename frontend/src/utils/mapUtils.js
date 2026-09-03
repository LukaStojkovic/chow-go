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
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (seconds == null) return null;
  const mins = Math.max(1, Math.round(seconds / 60));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
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
