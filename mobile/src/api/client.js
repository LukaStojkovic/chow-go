import axios from "axios";
import { API_URL } from "@/lib/config";
import { clearToken, getToken } from "@/lib/secureToken";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  // Without this the backend omits the token from login/register bodies and
  // every later request is silently unauthenticated. See backend/utils/clientType.js.
  headers: { "X-Client": "mobile" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

// The API returns at least four envelope shapes; `message` is the only field
// every error path reliably sets.
export function errorMessage(error, fallback = "Something went wrong") {
  if (error?.message === "Network Error") {
    return "Can't reach Chow & Go. Check your connection and that the API is running.";
  }
  return error?.response?.data?.message ?? error?.message ?? fallback;
}
