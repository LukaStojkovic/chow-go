import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REFERRAL_STORAGE_KEY } from "@/lib/referralStorage";
import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, createWrapper } from "@/test/utils";
import { useReferralAutoApply } from "./useReferralAutoApply";

vi.mock("@/services/apiReferral", () => ({
  getMyReferral: vi.fn(),
  applyReferralCode: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const rewards = { currency: "RSD", friend: 300, referrer: 300, minSubtotal: 1000 };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ authUser: null });
  getMyReferral.mockResolvedValue({ code: "OWNCODE2", rewards, canApplyCode: true });
});

describe("useReferralAutoApply", () => {
  it("applies a stored code once after a customer signs in, then clears it", async () => {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, "K7PQ2M9X");
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    renderHook(() => useReferralAutoApply(), { wrapper: createWrapper() });

    expect(applyReferralCode).not.toHaveBeenCalled();

    act(() => useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } }));

    await waitFor(() => expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull());
    expect(applyReferralCode).toHaveBeenCalledTimes(1);
    expect(applyReferralCode).toHaveBeenCalledWith("K7PQ2M9X");
    expect(toast.success).toHaveBeenCalled();

    act(() => useAuthStore.setState({ authUser: { _id: "u1", role: "customer", name: "Ana" } }));
    expect(applyReferralCode).toHaveBeenCalledTimes(1);
  });

  it("toasts a refusal and still clears the code", async () => {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, "K7PQ2M9X");
    applyReferralCode.mockRejectedValue(axiosError(400, { code: "REFERRAL_NOT_NEW", message: "Too late" }));
    useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
    renderHook(() => useReferralAutoApply(), { wrapper: createWrapper() });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Too late"));
    expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
  });

  it("keeps the code for next time when the server never answers", async () => {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, "K7PQ2M9X");
    getMyReferral.mockRejectedValue(new Error("Network Error"));
    useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
    renderHook(() => useReferralAutoApply(), { wrapper: createWrapper() });

    await waitFor(() => expect(getMyReferral).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBe("K7PQ2M9X");
    expect(applyReferralCode).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("skips the request when the customer can no longer apply a code", async () => {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, "K7PQ2M9X");
    getMyReferral.mockResolvedValue({ code: "OWNCODE2", rewards, canApplyCode: false });
    useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
    renderHook(() => useReferralAutoApply(), { wrapper: createWrapper() });

    await waitFor(() => expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull());
    expect(applyReferralCode).not.toHaveBeenCalled();
  });

  it("does nothing for a seller", async () => {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, "K7PQ2M9X");
    useAuthStore.setState({ authUser: { _id: "u2", role: "seller" } });
    renderHook(() => useReferralAutoApply(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getMyReferral).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBe("K7PQ2M9X");
  });
});
