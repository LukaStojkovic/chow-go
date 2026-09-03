import { axiosInstance } from "@/lib/axios";

export async function getUserLocation(lat, lon) {
  const res = await axiosInstance.get("/location/get-location", {
    params: { lat, lon },
  });

  const props = res.data.address;

  const addressParts = [
    [props.road, props.house_number].filter(Boolean).join(" "),
    props.city,
    props.country,
  ].filter(Boolean);

  const address = addressParts.join(", ");

  return { address };
}

export const getLocationPrediction = async (input) => {
  if (!input.trim()) return [];
  try {
    const res = await axiosInstance.get("/location/location-prediction", {
      params: { query: input.trim() },
    });

    return res.data.data;
  } catch (err) {
    console.error("Error fetching location predictions from API:", err);
    return [];
  }
};

export async function getNearbyRestaurants(lat, lon, radius) {
  try {
    const res = await axiosInstance.get("/location/get-near-restaurants", {
      // The endpoint reads `maxDistanceMeters`; sending `radius` meant the
      // argument was silently dropped and every request used the 20km default.
      params: { lat, lon, maxDistanceMeters: radius },
    });

    return res.data.data;
  } catch (err) {
    console.error("Error fetching nearby restaurants:", err);
    // Rethrow so React Query can move the section into its error state.
    // Returning [] here made a failed request indistinguishable from an area
    // with no restaurants, so the UI showed "none nearby" for a 500.
    throw err;
  }
}
