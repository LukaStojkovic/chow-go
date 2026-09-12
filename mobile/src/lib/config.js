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

const VAR = { api: "EXPO_PUBLIC_API_URL", socket: "EXPO_PUBLIC_SOCKET_URL" };

/**
 * The dev-host fallback is a development convenience and nothing more.
 *
 * There was no `__DEV__` guard here, so a release build with the variable unset
 * - which is what mobile/.env held, and eas.json supplied nothing for the
 * production profile - silently resolved to http://localhost:8000/api. Every
 * request in the shipped app then failed with a generic network error telling
 * the user to "check that the API is running".
 *
 * A release build throws instead. There is no useful app without an API, and a
 * build that cannot reach one should not get as far as the App Store.
 */
function resolve(envValue, kind) {
  const env = envValue?.trim();
  const name = VAR[kind];

  if (env && !/localhost|127\.0\.0\.1/.test(env)) {
    if (!__DEV__ && env.startsWith("http://")) {
      throw new Error(`${name} must use https in a release build.`);
    }
    return env.replace(/\/$/, "");
  }

  if (!__DEV__) {
    throw new Error(
      `${name} is not set. A release build has no dev host to fall back to - ` +
        "set it in the eas.json build profile.",
    );
  }

  const host = devHost();
  return kind === "api" ? `http://${host}:8000/api` : `http://${host}:8000`;
}

export const API_URL = resolve(process.env.EXPO_PUBLIC_API_URL, "api");
export const SOCKET_URL = resolve(process.env.EXPO_PUBLIC_SOCKET_URL, "socket");
