import axios from "axios";
import { LOCALE_HEADER, currentLocale } from "@chowgo/shared/i18n";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:8000/api"
      : "/api",
  withCredentials: true,
});

// Read per request rather than set once at module scope: the header has to
// follow a language the user switches mid-session, and this is what lets the
// backend render its error messages and push notification copy to match what
// they are looking at.
axiosInstance.interceptors.request.use((config) => {
  config.headers[LOCALE_HEADER] = currentLocale();
  return config;
});
