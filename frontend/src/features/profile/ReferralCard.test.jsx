import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, createTestQueryClient, renderWithProviders } from "@/test/utils";
import { ReferralCard } from "./ReferralCard";

vi.mock("@/services/apiReferral", () => ({
  getMyReferral: vi.fn(),
  applyReferralCode: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const rewards = { currency: "RSD", friend: 300, referrer: 300, minSubtotal: 1000 };

function referral(overrides = {}) {
  return {
    code: "K7PQ2M9X",
    rewards,
    stats: { invited: 3, rewarded: 1 },
    appliedCode: null,
    canApplyCode: true,
    ...overrides,
  };
}

function renderCard() {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const user = userEvent.setup();
  renderWithProviders(<ReferralCard />, { queryClient });
  return { invalidate, user };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
});

describe("ReferralCard", () => {
  it("renders the code and stats", async () => {
    getMyReferral.mockResolvedValue(referral());
    renderCard();

    expect(await screen.findByTestId("referral-code")).toHaveTextContent("K7PQ2M9X");
    expect(screen.getByText(/3 friends invited/)).toBeInTheDocument();
    expect(screen.getByText(/1 reward earned/)).toBeInTheDocument();
  });

  it("copies the code and the invite link", async () => {
    getMyReferral.mockResolvedValue(referral());
    const { user } = renderCard();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    await user.click(await screen.findByRole("button", { name: t("profile:referral.copy") }));
    expect(writeText).toHaveBeenCalledWith("K7PQ2M9X");

    await user.click(screen.getByRole("button", { name: t("profile:referral.copyLink") }));
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/invite/K7PQ2M9X`);
  });

  it("applies a friend's code and refreshes the vouchers", async () => {
    getMyReferral.mockResolvedValue(referral());
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    const { user, invalidate } = renderCard();

    await user.type(await screen.findByRole("textbox"), "abcd-efgh{Enter}");

    await waitFor(() => expect(applyReferralCode).toHaveBeenCalled());
    expect(applyReferralCode.mock.calls[0][0]).toBe("ABCDEFGH");
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["myVouchers"] }));
  });

  it("shows a refusal inline", async () => {
    getMyReferral.mockResolvedValue(referral());
    applyReferralCode.mockRejectedValue(
      axiosError(400, { code: "REFERRAL_OWN_CODE", message: "That is your own invite code." }),
    );
    const { user } = renderCard();

    await user.type(await screen.findByRole("textbox"), "K7PQ2M9X{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("That is your own invite code.");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the code the customer joined with instead of the form", async () => {
    getMyReferral.mockResolvedValue(referral({ appliedCode: "ZZZZ2222", canApplyCode: false }));
    renderCard();

    expect(await screen.findByText(t("profile:referral.appliedCode", { code: "ZZZZ2222" }))).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
