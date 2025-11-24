import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export async function checkAuth() {
  try {
    const response = await axiosInstance.get("/auth/check");

    return response.data;
  } catch (err) {
    console.error("Error checking auth:", err);
  }
}

export async function registerUser(data) {
  try {
    const response = await axiosInstance.post("/auth/register", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.success("Account Created");
    return response.data;
  } catch (err) {
    console.error("Error registerUser:", err);
    toast.error(err.response?.data?.message || "Registration failed");
  }
}

export async function loginUser(data) {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    toast.success("Login successful!");
    return response.data;
  } catch (err) {
    console.error("Error loginUser:", err);
    toast.error(err.response?.data?.message);
  }
}

export async function logoutUser() {
  try {
    const response = await axiosInstance.post("/auth/logout");
    toast.success(response.data.message);
    return response.data;
  } catch (err) {
    console.error("Error logoutUser:", err);
    toast.error("Logout failed");
  }
}
