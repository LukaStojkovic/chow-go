import { api } from "@/api/client";

// Mirrors the web's formatting so the two clients render the same address for
// the same coordinates. Moves to the shared package with the rest of the
// service layer once a second client actually needs it.
function formatNominatimAddress(address = {}) {
  return [
    [address.road, address.house_number].filter(Boolean).join(" "),
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function reverseGeocode({ lat, lon }) {
  const { data } = await api.get("/location/get-location", { params: { lat, lon } });
  return { address: formatNominatimAddress(data.address) };
}

export async function getLocationPredictions(query) {
  const { data } = await api.get("/location/location-prediction", { params: { query } });
  return data;
}
