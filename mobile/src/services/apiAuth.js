import { api } from "@/api/client";
import { toFormData } from "@/api/uploads";

export async function checkAuth() {
  const { data } = await api.get("/auth/check");
  return data;
}

export async function loginUser({ email, password, rememberMe }) {
  const { data } = await api.post("/auth/login", { email, password, rememberMe });
  return data;
}

export async function registerCustomer(payload) {
  const { data } = await api.post("/auth/register", { ...payload, role: "customer" });
  return data;
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function verifyOtp(email, code) {
  const { data } = await api.post("/auth/verify-otp", { email, code });
  return data;
}

export async function resetPassword(email, newPassword) {
  const { data } = await api.post("/auth/reset-password", { email, newPassword });
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/auth/update-profile", payload);
  return data;
}

/**
 * Seller signup is one multipart request, not a staged one: the backend creates
 * the user and the restaurant together and deletes the user again if any part
 * of the restaurant is missing. The wizard collects everything first.
 */
export async function registerSeller({ images, ...fields }) {
  const form = toFormData(fields, { restaurantImages: images });
  const { data } = await api.post("/auth/register", form);
  return data;
}

/** Courier signup is plain JSON — no images, unlike the seller path. */
export async function registerCourier(payload) {
  const { data } = await api.post("/auth/register/courier", { ...payload, role: "courier" });
  return data;
}
