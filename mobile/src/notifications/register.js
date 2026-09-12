import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "@/api/client";
import { ensureChannels } from "./channels";
import { reportError } from "@/lib/monitoring";

let registeredToken = null;

/**
 * Asks for permission, then hands the Expo push token to the backend.
 *
 * Returns null rather than throwing: a customer who declines notifications
 * should still get a working app, just without background updates.
 */
export async function registerForPush() {
  // A simulator has no push token, and asking produces a confusing error.
  if (!Device.isDevice) return null;

  try {
    await ensureChannels();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return null;

    // `eas init` writes this into app.json. Without it getExpoPushTokenAsync
    // fails on SDK 49+, and the cause is a missing setup step rather than
    // anything the running app did, so it is named rather than swallowed below.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      reportError(new Error("push registration: no EAS projectId"), { hint: "run `eas init`" });
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await api.post("/notifications/register-device", {
      token,
      platform: Platform.OS,
      deviceId: Device.osBuildId ?? undefined,
    });

    registeredToken = token;
    return token;
  } catch (error) {
    // Push is how a customer learns their order was confirmed. A silent
    // console.warn here means a broken setup is invisible in production.
    reportError(error, { stage: "registerForPush" });
    return null;
  }
}

/** Called on sign-out so a shared phone stops receiving the last user's orders. */
export async function unregisterPush() {
  if (!registeredToken) return;
  try {
    await api.delete("/notifications/device", { data: { token: registeredToken } });
  } catch {
    // The token is also detached server-side when another account claims it.
  } finally {
    registeredToken = null;
  }
}
