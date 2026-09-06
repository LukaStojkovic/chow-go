import { Expo } from "expo-server-sdk";
import User from "../models/User.js";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Best-effort push to every device a user has registered.
 *
 * Swallows its own errors, matching orderSocket.service.js: a push failure must
 * never fail the HTTP request that triggered it.
 */
export async function sendPushToUser(userId, payload) {
  if (!userId || !payload) return;

  try {
    const user = await User.findById(userId).select("+pushTokens").lean();
    const tokens = (user?.pushTokens ?? [])
      .map((entry) => entry.token)
      .filter((token) => Expo.isExpoPushToken(token));

    if (tokens.length === 0) return;

    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      priority: "high",
      // Must match the channel the client creates, or Android silently drops
      // the notification's importance to default.
      channelId: "orders",
    }));

    for (const chunk of expo.chunkPushNotifications(messages)) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);

      receipts.forEach((receipt, index) => {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          // The app was uninstalled or the token rotated; stop sending to it.
          User.updateOne(
            { _id: userId },
            { $pull: { pushTokens: { token: chunk[index].to } } },
          ).catch(() => {});
        }
      });
    }
  } catch (error) {
    console.error("Push send error:", error.message);
  }
}
