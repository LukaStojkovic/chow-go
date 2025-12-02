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
