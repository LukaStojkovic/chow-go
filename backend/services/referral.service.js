import { randomBytes } from "crypto";
import {
  REFERRAL,
  REFERRAL_ALPHABET,
  isValidReferralCode,
  normalizeReferralCode,
  referralRewardsFor,
} from "@chowgo/shared/referral";
import Order from "../models/Order.js";
import Referral from "../models/Referral.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { CURRENCY_CODE } from "../utils/money.js";
import { logger } from "../utils/logger.js";
import { createPersonalVoucher, pushVoucher } from "./promoCode.service.js";

const DAY = 24 * 60 * 60 * 1000;
const NOT_PLACED = ["cancelled", "rejected"];
const refuse = (key, code, status = 400) => new AppError(`errors:referral.${key}`, status, code);

function newCode() {
  const bytes = randomBytes(REFERRAL.codeLength);
  return Array.from(bytes, (byte) => REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length]).join("");
}

async function ensureCode(user) {
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      const updated = await User.findOneAndUpdate(
        { _id: user._id, referralCode: { $exists: false } },
        { $set: { referralCode: code } },
        { new: true },
      ).select("referralCode");
      if (updated) return updated.referralCode;
      return (await User.findById(user._id).select("referralCode").lean()).referralCode;
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new AppError("Could not generate a referral code", 500);
}

const hasPlacedOrder = (customerId) => Order.exists({ customer: customerId, status: { $nin: NOT_PLACED } });

/** The caller's code, what the programme pays, and how their invites are doing. */
export async function getMyReferral(user) {
  if (user.role !== "customer") throw refuse("customerOnly", "REFERRAL_CUSTOMER_ONLY", 403);
  const code = await ensureCode(user);
  const [invited, rewarded, applied, ordered] = await Promise.all([
    Referral.countDocuments({ referrer: user._id }),
    Referral.countDocuments({ referrer: user._id, status: "rewarded" }),
    Referral.findOne({ referred: user._id }).select("code").lean(),
    hasPlacedOrder(user._id),
  ]);
  return {
    code,
    rewards: referralRewardsFor(CURRENCY_CODE),
    stats: { invited, rewarded },
    appliedCode: applied?.code ?? null,
    canApplyCode: !applied && !ordered,
  };
}

/**
 * A new customer enters a friend's code before their first order and gets a
 * first-order voucher straight away. The unique index on `referred` settles a
 * double submit.
 */
export async function applyReferralCode(user, rawCode) {
  if (user.role !== "customer") throw refuse("customerOnly", "REFERRAL_CUSTOMER_ONLY", 403);
  if (!isValidReferralCode(rawCode)) throw refuse("invalidCode", "REFERRAL_INVALID_CODE");
  const code = normalizeReferralCode(rawCode);

  const referrer = await User.findOne({ referralCode: code }).select("_id role").lean();
  if (!referrer) throw refuse("invalidCode", "REFERRAL_INVALID_CODE");
  if (String(referrer._id) === String(user._id)) throw refuse("ownCode", "REFERRAL_OWN_CODE");
  if (await Referral.exists({ referred: user._id })) throw refuse("alreadyApplied", "REFERRAL_ALREADY_APPLIED", 409);
  if (await hasPlacedOrder(user._id)) throw refuse("notNew", "REFERRAL_NOT_NEW");

  let referral;
  try {
    referral = await Referral.create({ referrer: referrer._id, referred: user._id, code });
  } catch (err) {
    if (err?.code === 11000) throw refuse("alreadyApplied", "REFERRAL_ALREADY_APPLIED", 409);
    throw err;
  }

  const rewards = referralRewardsFor(CURRENCY_CODE);
  try {
    const voucher = await createPersonalVoucher({
      type: "fixed",
      value: rewards.friend,
      minSubtotal: rewards.minSubtotal,
      firstOrderOnly: true,
      currency: rewards.currency,
      label: "Referral welcome",
      endsAt: new Date(Date.now() + REFERRAL.friendValidDays * DAY),
      assignedTo: user._id,
      sourceReferral: referral._id,
      createdBy: referrer._id,
    });
    await Referral.updateOne({ _id: referral._id }, { $set: { friendVoucher: voucher._id } });
    pushVoucher(voucher, { titleKey: "promo:push.referralFriendTitle", bodyKey: "promo:push.referralFriendBody" });
    return { voucherCode: voucher.code, rewards };
  } catch (err) {
    await Referral.deleteOne({ _id: referral._id });
    throw err;
  }
}

/**
 * When a referred customer's first order is delivered, the friend who invited
 * them gets their voucher - once, and no more than the monthly cap.
 */
export async function rewardReferrerForDelivery(order) {
  if (order?.status !== "delivered") return null;
  const pending = await Referral.findOne({ referred: order.customer, status: "pending" }).lean();
  if (!pending) return null;

  const delivered = await Order.countDocuments({ customer: order.customer, status: "delivered" });
  if (delivered !== 1) return null;

  const recent = await Referral.countDocuments({
    referrer: pending.referrer,
    status: "rewarded",
    rewardedAt: { $gte: new Date(Date.now() - 30 * DAY) },
  });
  const capped = recent >= REFERRAL.maxRewardsPerMonth;

  const claimed = await Referral.findOneAndUpdate(
    { _id: pending._id, status: "pending" },
    { $set: { status: capped ? "capped" : "rewarded", rewardedAt: new Date() } },
    { new: true },
  );
  if (!claimed || capped) return null;

  const rewards = referralRewardsFor(order.currency);
  const voucher = await createPersonalVoucher({
    type: "fixed",
    value: rewards.referrer,
    currency: rewards.currency,
    label: "Referral reward",
    endsAt: new Date(Date.now() + REFERRAL.referrerValidDays * DAY),
    assignedTo: pending.referrer,
    sourceReferral: pending._id,
    createdBy: pending.referrer,
  });
  await Referral.updateOne({ _id: pending._id }, { $set: { referrerVoucher: voucher._id } });
  pushVoucher(voucher, { titleKey: "promo:push.referralRewardTitle", bodyKey: "promo:push.referralRewardBody" });
  return voucher;
}

/** Fire-and-forget wrapper for the delivery path: a reward never fails a delivery. */
export function rewardReferrerSafely(order) {
  rewardReferrerForDelivery(order).catch((err) =>
    logger.error({ err, orderId: String(order?._id) }, "Referral reward failed"),
  );
}
