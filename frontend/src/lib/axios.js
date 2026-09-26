import axios from "axios";
import { LOCALE_HEADER, currentLocale } from "@chowgo/shared/i18n";

let unauthorizedHandler = null;

// Registered by the auth store, which cannot be imported here without a cycle
// (the store imports the services that import this module).
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:8000/api"
      : "/api",
  withCredentials: true,
  // Without one a hung backend left "Placing..." spinning forever.
  timeout: 15000,
});

// Read per request rather than set once at module scope: the header has to
// follow a language the user switches mid-session, and this is what lets the
// backend render its error messages and push notification copy to match what
// they are looking at.
axiosInstance.interceptors.request.use((config) => {
  config.headers[LOCALE_HEADER] = currentLocale();
  return config;
});

// A session revoked by logout elsewhere, a password change or expiry left the
// UI signed in while every request failed. checkAuth is excluded: it reports a
// missing session on every anonymous page load, which is not an event.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error?.config?.url?.includes("/auth/check");
    if (error?.response?.status === 401 && !isAuthCheck) unauthorizedHandler?.();
    return Promise.reject(error);
  },
);
