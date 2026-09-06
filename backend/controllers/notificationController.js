import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export async function registerDevice(req, res, next) {
  const { token, platform, deviceId } = req.body;

  if (!Expo.isExpoPushToken(token)) {
    return next(new AppError("Invalid push token", 400));
  }
  if (!["ios", "android"].includes(platform)) {
    return next(new AppError("Invalid platform", 400));
  }

  // A phone can be handed to another account. Detaching the token everywhere
  // first is what stops the previous owner receiving this device's orders.
  await User.updateMany(
    { "pushTokens.token": token },
    { $pull: { pushTokens: { token } } },
  );

  await User.updateOne(
    { _id: req.user._id },
    {
      $push: {
        pushTokens: {
          $each: [{ token, platform, deviceId, lastSeenAt: new Date() }],
          $slice: -10,
        },
      },
    },
  );

  res.status(200).json({ status: "success" });
}

export async function unregisterDevice(req, res) {
  const { token } = req.body;

  if (token) {
    await User.updateOne({ _id: req.user._id }, { $pull: { pushTokens: { token } } });
  }

  res.status(200).json({ status: "success" });
}
