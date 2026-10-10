import { describe, expect, it } from "vitest";

import { REFERRAL_ALPHABET, isValidReferralCode, normalizeReferralCode, referralLink, referralRewardsFor } from "../src/referral.js";

describe("referral rules", () => {
  it("prices rewards in the order's currency, defaulting to dinars", () => {
    expect(referralRewardsFor("RSD")).toEqual({ currency: "RSD", friend: 300, referrer: 300, minSubtotal: 1000 });
    expect(referralRewardsFor("eur")).toMatchObject({ currency: "EUR", friend: 3, minSubtotal: 10 });
    expect(referralRewardsFor(undefined).currency).toBe("RSD");
  });

  it("accepts codes however they are typed", () => {
    expect(normalizeReferralCode(" abcd-ef23 ")).toBe("ABCDEF23");
    expect(isValidReferralCode("abcd ef23")).toBe(true);
    expect(isValidReferralCode("ABCDEF2")).toBe(false);
    expect(isValidReferralCode("ABCDEF20")).toBe(false);
    expect(REFERRAL_ALPHABET).not.toMatch(/[01IO]/);
  });

  it("builds the share link", () => {
    expect(referralLink("https://chowgo.app/", "abcd-ef23")).toBe("https://chowgo.app/invite/ABCDEF23");
  });
});
