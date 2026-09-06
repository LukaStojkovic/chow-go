import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Android routes every notification through a channel; the id must match what
// push.service.js sends as channelId or the importance silently drops.
export async function ensureChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("orders", {
    name: "Order updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
