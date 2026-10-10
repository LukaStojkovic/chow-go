import { isValidReferralCode, normalizeReferralCode } from "@chowgo/shared/referral";

export const REFERRAL_STORAGE_KEY = "chowgo.referralCode";
export const REFERRAL_STORED_EVENT = "chowgo:referral-stored";

export function readStoredReferralCode() {
  try {
    const code = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    return code && isValidReferralCode(code) ? normalizeReferralCode(code) : null;
  } catch {
    return null;
  }
}

export function storeReferralCode(code) {
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalizeReferralCode(code));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(REFERRAL_STORED_EVENT));
}

export function clearStoredReferralCode() {
  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Blocked storage has nothing to clear.
  }
}
