import { api } from "@/api/client";

export async function checkAuth() {
  const { data } = await api.get("/auth/check");
  return data;
}

export async function loginUser({ email, password, rememberMe }) {
  const { data } = await api.post("/auth/login", { email, password, rememberMe });
  return data;
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}
