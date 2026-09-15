import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { t } from "@chowgo/shared/i18n";

/**
 * Android routes every notification through a channel; the id must match what
 * push.service.js sends as channelId or the importance silently drops.
 *
 * **Channel ids are immutable once created** - a user who has the app installed
 * keeps the settings they were first given, and renaming or re-importancing an
 * id does nothing. So the split has to be right before v1 ships: one channel
 * for anything tied to a live order, a separate one for marketing, so a user
 * who mutes promotions does not also mute "your courier is outside".
 */
export const CHANNELS = {
  orders: "orders",
  promotions: "promotions",
};

export async function ensureChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNELS.orders, {
    name: t("order:notification.channelOrders"),
    description: t("order:notification.channelOrdersHint"),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.promotions, {
    name: t("order:notification.channelPromotions"),
    description: t("order:notification.channelPromotionsHint"),
    // Deliberately lower: this one arrives without a sound, and muting it must
    // stay a separate decision from muting order updates.
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}
