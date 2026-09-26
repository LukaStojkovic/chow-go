import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import { localeForUser } from "../middlewares/locale.js";
import { logger } from "../utils/logger.js";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Best-effort push to every device a user has registered.
 *
 * Swallows its own errors, matching orderSocket.service.js: a push failure must
 * never fail the HTTP request that triggered it.
 *
 * `payload` may be a function. The notification has to be written in the
 * *recipient's* language, which is on the user document this already loads -
 * so passing a builder lets the copy be rendered once the locale is known,
 * instead of every caller fetching the recipient a second time just to ask
 * what language they read.
 *
 * @param {string} userId
 * @param {Object | ((locale: string) => Object | null) | null} payload
 */
export async function sendPushToUser(userId, payload) {
  if (!userId || !payload) return;

  try {
    const user = await User.findById(userId)
      .select("+pushTokens locale")
      .lean();

    const resolved =
      typeof payload === "function" ? payload(localeForUser(user)) : payload;
    if (!resolved) return;

    const tokens = (user?.pushTokens ?? [])
      .map((entry) => entry.token)
      .filter((token) => Expo.isExpoPushToken(token));

    if (tokens.length === 0) return;

    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      title: resolved.title,
      body: resolved.body,
      data: resolved.data ?? {},
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
    logger.error({ err: error.message }, "Push send error");
  }
}

/**
 * The same push to many users with one lookup and chunked sends. Calling
 * sendPushToUser in a loop cost a query and an Expo round trip per courier,
 * which is what kept "mark ready" waiting on the whole on-duty fleet.
 *
 * @param {string[]} userIds
 * @param {(locale: string) => Object | null} buildPayload
 */
export async function sendPushToUsers(userIds, buildPayload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;

  try {
    const users = await User.find({ _id: { $in: userIds } })
      .select("+pushTokens locale")
      .lean();

    const messages = [];
    const owners = [];
    const byLocale = new Map();
    for (const user of users) {
      const locale = localeForUser(user);
      if (!byLocale.has(locale)) byLocale.set(locale, buildPayload(locale));
      const payload = byLocale.get(locale);
      if (!payload) continue;
      for (const { token } of user.pushTokens ?? []) {
        if (!Expo.isExpoPushToken(token)) continue;
        messages.push({
          to: token,
          sound: "default",
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          priority: "high",
          channelId: "orders",
        });
        owners.push(user._id);
      }
    }

    let offset = 0;
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      receipts.forEach((receipt, index) => {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          User.updateOne(
            { _id: owners[offset + index] },
            { $pull: { pushTokens: { token: chunk[index].to } } },
          ).catch(() => {});
        }
      });
      offset += chunk.length;
    }
  } catch (error) {
    logger.error({ err: error.message }, "Push send error");
  }
}
