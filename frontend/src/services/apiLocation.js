import { axiosInstance } from "@/lib/axios";

export async function getUserLocation(lat, lon) {
  const res = await axiosInstance.get("/location/get-location", {
    params: { lat, lon },
  });

  const props = res.data.address;
  const address = `${props.road || ""} ${props.house_number || ""}, ${
    props.city
  }, ${props.country}`
    .trim()
    .replace(/^,/, "")
    .trim();

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
