import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

// Registrations before installation ids carried the OS build number, which
// every phone on that OS version shares, so it proves nothing.
const isInstallationId = (value) => typeof value === "string" && value.startsWith("inst_");

export async function registerDevice(req, res, next) {
  const { token, platform, deviceId } = req.body;

  if (!Expo.isExpoPushToken(token)) {
    return next(new AppError("Invalid push token", 400));
  }
  if (!["ios", "android"].includes(platform)) {
    return next(new AppError("Invalid platform", 400));
  }
  if (deviceId !== undefined && (typeof deviceId !== "string" || deviceId.length > 100)) {
    return next(new AppError("Invalid device id", 400));
  }

  // A phone can be handed to another account, and moving the token is what
  // stops the previous owner receiving this device's orders. But anyone who
  // learned a token could claim it the same way, so a token already registered
  // with an installation id only moves for a request presenting that id.
  const holders = await User.find({ "pushTokens.token": token, _id: { $ne: req.user._id } })
    .select("+pushTokens")
    .lean();
  const claimedElsewhere = holders.some((holder) => {
    const entry = holder.pushTokens?.find((t) => t.token === token);
    return isInstallationId(entry?.deviceId) && entry.deviceId !== deviceId;
  });
  if (claimedElsewhere) {
    return next(
      new AppError("This device is registered to another account", 409, "PUSH_TOKEN_CLAIMED"),
    );
  }

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
