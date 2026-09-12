import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import User from "../models/User.js";
import Addresses from "../models/Addresses.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import Notification from "../models/OrderNotification.js";
import { AppError } from "../utils/AppError.js";
import { ACTIVE_STATUSES } from "../utils/orderStatus.js";

/**
 * Deleting an account anonymises the user rather than removing the document.
 *
 * Orders are commercial records for the restaurant and the courier as well as
 * the customer, and a hard delete would tear holes in their history and their
 * revenue figures. So the personal data goes and the row stays: the order keeps
 * its totals and timestamps, and its customer reference points at a tombstone
 * with no name, email, phone or address on it. That is the shape GDPR erasure
 * takes when a record has a legitimate business purpose.
 */
const TOMBSTONE_DOMAIN = "deleted.invalid";

async function assertNoActiveWork(user) {
  const asCustomer = await Order.exists({
    customer: user._id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (asCustomer) {
    throw new AppError(
      "You have an order in progress. You can delete your account once it is finished.",
      409,
      "ACTIVE_ORDER",
    );
  }

  if (user.role === "courier") {
    const courier = await Courier.findOne({ userId: user._id });
    if (courier) {
      const delivering = await Order.exists({
        courier: courier._id,
        status: { $in: ACTIVE_STATUSES },
      });
      if (delivering) {
        throw new AppError(
          "You have a delivery in progress. Finish or release it first.",
          409,
          "ACTIVE_DELIVERY",
        );
      }
    }
  }

  if (user.role === "seller") {
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (restaurant) {
      const open = await Order.exists({
        restaurant: restaurant._id,
        status: { $in: ACTIVE_STATUSES },
      });
      if (open) {
        throw new AppError(
          "Your restaurant has orders in progress. Close them before deleting your account.",
          409,
          "ACTIVE_RESTAURANT_ORDERS",
        );
      }
    }
  }
}

export async function deleteAccountOperation({ user, password }) {
  // A Google account has no password to check, so the session itself is the
  // proof. A local account must re-authenticate: this is irreversible, and a
  // borrowed unlocked phone should not be enough.
  if (user.authProvider === "local") {
    if (!password) {
      throw new AppError("Enter your password to confirm", 400, "PASSWORD_REQUIRED");
    }
    const withPassword = await User.findById(user._id).select("+password");
    const correct = await bcrypt.compare(password, withPassword.password ?? "");
    if (!correct) {
      throw new AppError("That password is not correct", 400, "PASSWORD_INCORRECT");
    }
  }

  await assertNoActiveWork(user);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const suffix = randomBytes(8).toString("hex");

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            name: "Deleted account",
            email: `deleted-${suffix}@${TOMBSTONE_DOMAIN}`,
            profilePicture: "",
            // Unusable rather than empty: the field is required for local
            // accounts, and a blank hash would match nothing but still looks
            // like a credential.
            password: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
            favouriteRestaurants: [],
            pushTokens: [],
            isDeleted: true,
            deletedAt: new Date(),
          },
          // $unset, not $set: undefined in a $set is silently ignored, which
          // left the phone number on the tombstone.
          $unset: {
            phoneNumber: 1,
            googleId: 1,
            otpHash: 1,
            otpExpiry: 1,
            otpAttempts: 1,
            resetTokenHash: 1,
            resetTokenExpiry: 1,
          },
          // Ends every session and socket already issued.
          $inc: { tokenVersion: 1 },
        },
        { session },
      );

      // These hold nothing of value to anyone else.
      await Addresses.deleteMany({ userId: user._id }, { session });
      await Cart.deleteMany({ user: user._id }, { session });
      await Notification.deleteMany({ recipient: user._id }, { session });

      if (user.role === "courier") {
        await Courier.updateOne(
          { userId: user._id },
          {
            $set: {
              fullName: "Deleted account",
              email: `deleted-${suffix}@${TOMBSTONE_DOMAIN}`,
              phoneNumber: "",
              isAvailable: false,
              currentOrder: null,
              verificationStatus: "rejected",
              documents: {},
              bankDetails: {},
            },
            $unset: { currentLocation: 1 },
          },
          { session },
        );
      }

      if (user.role === "seller") {
        // The restaurant stops trading but is not removed: its orders, menu and
        // ratings are the other parties' records too.
        await Restaurant.updateOne(
          { ownerId: user._id },
          { $set: { isActive: false, isOpenNow: false } },
          { session },
        );
      }

      // The delivery snapshot is the customer's home address, and it is no
      // longer needed once nothing is in flight.
      await Order.updateMany(
        { customer: user._id },
        {
          $set: {
            "deliveryAddressSnapshot.fullAddress": "[deleted]",
            customerNotes: "",
          },
          $unset: {
            "deliveryAddressSnapshot.label": 1,
            "deliveryAddressSnapshot.buildingName": 1,
            "deliveryAddressSnapshot.apartment": 1,
            "deliveryAddressSnapshot.floor": 1,
            "deliveryAddressSnapshot.entrance": 1,
            "deliveryAddressSnapshot.doorCode": 1,
            "deliveryAddressSnapshot.notes": 1,
            "deliveryAddressSnapshot.location": 1,
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}
