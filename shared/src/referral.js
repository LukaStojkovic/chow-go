/**
 * The referral programme: a friend who signs up with a customer's code gets a
 * voucher for their first order, and the customer who invited them gets one
 * once that first order is delivered. The backend issues the vouchers with
 * these amounts and the clients quote them, so the two cannot disagree.
 */
import { normalizeCurrency } from "./currency.js";

export const REFERRAL = {
  friendValidDays: 30,
  referrerValidDays: 60,
  maxRewardsPerMonth: 20,
  codeLength: 8,
};

const REWARDS = {
  RSD: { friend: 300, referrer: 300, minSubtotal: 1000 },
  EUR: { friend: 3, referrer: 3, minSubtotal: 10 },
  USD: { friend: 3, referrer: 3, minSubtotal: 10 },
};

/** Voucher amounts and the friend's minimum first order, in a currency. */
export function referralRewardsFor(currency) {
  const code = normalizeCurrency(currency);
  return { currency: code, ...(REWARDS[code] ?? REWARDS.RSD) };
}

// No 0/O or 1/I, so a code read aloud or off a screen survives.
export const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PATTERN = new RegExp(`^[${REFERRAL_ALPHABET}]{${REFERRAL.codeLength}}$`);

/** A code as typed or pasted, uppercased and stripped of spaces and dashes. */
export function normalizeReferralCode(value) {
  return String(value ?? "").toUpperCase().replace(/[\s-]/g, "");
}

export function isValidReferralCode(value) {
  return CODE_PATTERN.test(normalizeReferralCode(value));
}

/** The link a customer shares: the web app's invite page with their code. */
export function referralLink(origin, code) {
  return `${String(origin ?? "").replace(/\/+$/, "")}/invite/${normalizeReferralCode(code)}`;
}
