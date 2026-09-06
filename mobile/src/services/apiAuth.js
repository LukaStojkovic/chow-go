import { api } from "@/api/client";

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
