import { axiosInstance } from "@/lib/axios";

export async function addUserDeliveryAddress(data) {
  try {
    const response = await axiosInstance.post("/delivery-address", data);

    return response.data;
  } catch (err) {
    console.error("Error adding delivery address:", err);
    throw err;
  }
}

export async function getUserDeliveryAddresses() {
  try {
    const response = await axiosInstance.get("/delivery-address");

    return response.data;
  } catch (err) {
    console.error("Error getting delivery addresses:", err);
    throw err;
  }
}

export async function setDefaultDeliveryAddress(addressId) {
  try {
    const response = await axiosInstance.patch(
      `/delivery-address/${addressId}/default`,
    );

    return response.data;
  } catch (err) {
    console.error("Error setting default delivery addresses:", err);
    throw err;
  }
}

export async function deleteDeliveryAddress(addressId) {
  try {
    const response = await axiosInstance.delete(
      `/delivery-address/${addressId}`,
    );

    return response.data;
  } catch (err) {
    console.error("Error deleting delivery address:", err);
    throw err;
  }
}
