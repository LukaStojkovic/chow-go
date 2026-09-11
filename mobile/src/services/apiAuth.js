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

/**
 * A photo makes this multipart; everything else stays JSON. The password
 * fields never travel alongside a picture, so the common save path is spared
 * a form-data round trip.
 */
export async function updateProfile({ profilePicture, ...fields } = {}) {
  if (!profilePicture) {
    const { data } = await api.put("/auth/update-profile", fields);
    return data;
  }

  const form = toFormData(fields, { profilePicture: [profilePicture] });
  const { data } = await api.put("/auth/update-profile", form);
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
