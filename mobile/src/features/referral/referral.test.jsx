import { Share } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";

import { applyReferralCode, getMyReferral } from "@/services/apiReferral";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { axiosError, createTestQueryClient, createWrapper } from "@/test/utils";
import Invite from "../../../app/(customer)/settings/invite";
import Register from "../../../app/(auth)/register";
import { readPendingReferral, savePendingReferral, usePendingReferral } from "./pendingReferral";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock("@/services/apiReferral", () => ({
  __esModule: true,
  getMyReferral: jest.fn(),
  applyReferralCode: jest.fn(),
}));

const rewards = { currency: "RSD", friend: 300, referrer: 300, minSubtotal: 1000 };
const me = (extra = {}) => ({
  code: "K7PQ2M9X",
  rewards,
  stats: { invited: 2, rewarded: 1 },
  appliedCode: null,
  canApplyCode: true,
  ...extra,
});
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const amount = formatPrice(300, { currency: "RSD" });
const appliedToast = () => t("profile:referral.applied", { amount });

async function renderScreen(Component, queryClient = createTestQueryClient()) {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Component />
    </SafeAreaProvider>,
    { wrapper: createWrapper(queryClient) },
  );
  return queryClient;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(toast, "success").mockImplementation(() => {});
  jest.spyOn(toast, "error").mockImplementation(() => {});
  useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
});

describe("Invite screen", () => {
  it("shows the code, stats and hint, and shares the message with the link", async () => {
    getMyReferral.mockResolvedValue(me());
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
    await renderScreen(Invite);

    expect(await screen.findByText("K7PQ2M9X")).toBeOnTheScreen();
    expect(screen.getByText(t("profile:referral.invited", { count: 2 }))).toBeOnTheScreen();
    expect(screen.getByText(t("profile:referral.rewarded", { count: 1 }))).toBeOnTheScreen();
    expect(
      screen.getByText(
        t("profile:referral.hint", {
          friend: amount,
          min: formatPrice(1000, { currency: "RSD" }),
          referrer: amount,
        }),
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: t("profile:referral.share") }));
    expect(share).toHaveBeenCalledTimes(1);
    const { message } = share.mock.calls[0][0];
    expect(message).toContain("K7PQ2M9X");
    expect(message).toContain(amount);
    expect(message).toMatch(/\/invite\/K7PQ2M9X/);
  });

  it("applies a friend's code and refreshes the vouchers", async () => {
    getMyReferral.mockResolvedValue(me());
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    const queryClient = createTestQueryClient();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    await renderScreen(Invite, queryClient);

    await fireEvent.changeText(
      await screen.findByLabelText(t("profile:referral.enterCode")),
      "ab cd-2345",
    );
    await fireEvent.press(screen.getByRole("button", { name: t("profile:referral.apply") }));

    await waitFor(() => expect(applyReferralCode.mock.calls[0][0]).toBe("ABCD2345"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["myVouchers"] }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(appliedToast()));
  });

  it("shows a refusal inline", async () => {
    getMyReferral.mockResolvedValue(me());
    applyReferralCode.mockRejectedValue(
      axiosError(400, {
        message: "That invite code does not exist.",
        code: "REFERRAL_INVALID_CODE",
      }),
    );
    await renderScreen(Invite);

    await fireEvent.changeText(
      await screen.findByLabelText(t("profile:referral.enterCode")),
      "ZZZZZZZZ",
    );
    await fireEvent.press(screen.getByRole("button", { name: t("profile:referral.apply") }));
    expect(await screen.findByText("That invite code does not exist.")).toBeOnTheScreen();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows the code used instead of the field once applied", async () => {
    getMyReferral.mockResolvedValue(me({ appliedCode: "ABCD2345", canApplyCode: false }));
    await renderScreen(Invite);

    expect(
      await screen.findByText(t("profile:referral.appliedCode", { code: "ABCD2345" })),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText(t("profile:referral.enterCode"))).not.toBeOnTheScreen();
  });
});

describe("Register", () => {
  async function fillAndSubmit(inviteCode) {
    await fireEvent.changeText(screen.getByLabelText(t("auth:fields.fullName")), "Ana");
    await fireEvent.changeText(screen.getByLabelText(t("auth:fields.email")), "ana@example.com");
    await fireEvent.changeText(screen.getByLabelText(t("auth:fields.phone")), "+381601234567");
    await fireEvent.changeText(screen.getByLabelText(t("auth:fields.password")), "secret123");
    await fireEvent.changeText(
      screen.getByLabelText(t("auth:fields.confirmPassword")),
      "secret123",
    );
    await fireEvent.changeText(screen.getByLabelText(t("profile:referral.enterCode")), inviteCode);
    await fireEvent.press(screen.getByRole("button", { name: t("auth:register.submit") }));
  }

  function signedOut() {
    const register = jest.fn(async () => ({ _id: "u2", role: "customer" }));
    useAuthStore.setState({ authUser: null, register, isSubmitting: false });
    return register;
  }

  it("applies the optional invite code after signing up", async () => {
    const register = signedOut();
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    await renderScreen(Register);

    await fillAndSubmit("abcd2345");

    await waitFor(() => expect(applyReferralCode).toHaveBeenCalledWith("ABCD2345"));
    expect(Object.keys(register.mock.calls[0][0]).sort()).toEqual([
      "email",
      "name",
      "password",
      "phoneNumber",
    ]);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(appliedToast()));
  });

  it("prefills a code from an invite link", async () => {
    signedOut();
    await savePendingReferral("abcd2345");
    await renderScreen(Register);

    await waitFor(() =>
      expect(screen.getByLabelText(t("profile:referral.enterCode")).props.value).toBe("ABCD2345"),
    );
  });

  it("still signs up when the code is refused, and sends nothing without one", async () => {
    const register = signedOut();
    applyReferralCode.mockRejectedValue(axiosError(400, { message: "Nope" }));
    const { router } = require("expo-router");
    await renderScreen(Register);

    await fillAndSubmit("ZZZZZZZZ");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(customer)"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(t("profile:referral.title"), {
        description: "Nope",
      }),
    );

    applyReferralCode.mockClear();
    await fillAndSubmit("");
    await waitFor(() => expect(register).toHaveBeenCalledTimes(2));
    expect(applyReferralCode).not.toHaveBeenCalled();
  });
});

describe("usePendingReferral", () => {
  it("applies a stored invite code once for a signed-in customer and clears it", async () => {
    getMyReferral.mockResolvedValue(me());
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    await savePendingReferral("abcd-2345");

    const { rerender } = await renderHook(() => usePendingReferral(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(applyReferralCode).toHaveBeenCalledWith("ABCD2345"));
    await waitFor(async () => expect(await readPendingReferral()).toBeNull());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(appliedToast()));
    await rerender({});
    await act(() =>
      useAuthStore.setState({ authUser: { _id: "u1", role: "customer", name: "Ana" } }),
    );
    await waitFor(() => expect(getMyReferral).toHaveBeenCalledTimes(1));
    expect(applyReferralCode).toHaveBeenCalledTimes(1);
  });

  it("drops the stored code without applying when the account cannot use one", async () => {
    getMyReferral.mockResolvedValue(me({ canApplyCode: false }));
    await savePendingReferral("ABCD2345");

    await renderHook(() => usePendingReferral(), { wrapper: createWrapper() });

    await waitFor(async () => expect(await readPendingReferral()).toBeNull());
    expect(applyReferralCode).not.toHaveBeenCalled();
  });

  it("waits for a customer to sign in", async () => {
    useAuthStore.setState({ authUser: null });
    await savePendingReferral("ABCD2345");
    await renderHook(() => usePendingReferral(), { wrapper: createWrapper() });

    expect(getMyReferral).not.toHaveBeenCalled();
    expect(await readPendingReferral()).toBe("ABCD2345");
  });

  it("applies a code from a link opened while already signed in", async () => {
    getMyReferral.mockResolvedValue(me());
    applyReferralCode.mockResolvedValue({ voucherCode: "GIFT-1", rewards });
    await renderHook(() => usePendingReferral(), { wrapper: createWrapper() });
    await waitFor(() => expect(getMyReferral).not.toHaveBeenCalled());

    await act(() => savePendingReferral("ABCD2345"));
    await waitFor(() => expect(applyReferralCode).toHaveBeenCalledWith("ABCD2345"));
  });
});
