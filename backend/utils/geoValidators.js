// GeoJSON order is [lng, lat]. A swapped or out-of-range pair used to save and
// then silently break every $geoNear query that touched it.
export const lngLat = {
  validator: (value) =>
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90,
  message: "Coordinates must be [longitude, latitude] within range",
};
