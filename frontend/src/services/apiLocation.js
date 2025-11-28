import { axiosInstance } from "@/lib/axios";

export async function getUserLocation(lat, lon) {
  const res = await axiosInstance.get("/location/get-location", {
    params: { lat, lon },
  });

  const props = res.data.features[0].properties;
  const address = `${props.street || ""} ${props.housenumber || ""}, ${
    props.city
  }, ${props.country}`
    .trim()
    .replace(/^,/, "")
    .trim();

  return { address };
}
