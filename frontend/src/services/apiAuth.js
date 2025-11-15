import { axiosInstance } from "@/lib/axios";

export async function checkAuth() {
  try {
    const response = await axiosInstance.get("/auth/check");

    return response.data;
  } catch (err) {
    console.error("Error checking auth:", err);
  }
}

export async function registerUser() {
  try {
    const response = await axiosInstance.get("/auth/register");

    return response.data;
  } catch (err) {
    console.error("Error registerUser:", err);
  }
}
