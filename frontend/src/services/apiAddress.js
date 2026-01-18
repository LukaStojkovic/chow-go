import { axiosInstance } from "@/lib/axios";

export async function addUserDeliveryAddress(data) {
  try {
    const response = await axiosInstance.post("/delivery-address", data);

    return response.data;
  } catch (err) {
    console.error("Error adding delivery address:", err);
  }
}

export async function getUserDeliveryAddresses() {
  try {
    const response = await axiosInstance.get("/delivery-address");

    return response.data;
  } catch (err) {
    console.error("Error getting delivery addresses:", err);
  }
}
