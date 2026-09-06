import Constants from "expo-constants";
import { Platform } from "react-native";

// A device on the LAN cannot reach the dev machine's "localhost". Expo's own
// packager already knows the right host, so borrow it.
function devHost() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.manifest?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
  ].filter(Boolean);

  for (const hostUri of candidates) {
    const host = hostUri.split(":")[0];
    if (host && host !== "127.0.0.1" && host !== "localhost") return host;
  }

  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
}

function resolve(envValue, kind) {
  const env = envValue?.trim();
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/$/, "");

  const host = devHost();
  return kind === "api" ? `http://${host}:8000/api` : `http://${host}:8000`;
}

export const API_URL = resolve(process.env.EXPO_PUBLIC_API_URL, "api");
export const SOCKET_URL = resolve(process.env.EXPO_PUBLIC_SOCKET_URL, "socket");
