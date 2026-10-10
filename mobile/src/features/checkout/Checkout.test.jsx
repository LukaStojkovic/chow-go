import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { deliveryTypes } from "@chowgo/shared/constants";
import { formatTime } from "@chowgo/shared/format";
import { t } from "@chowgo/shared/i18n";

import { useCreateOrder } from "@/hooks/Orders/useOrders";
import { formatScheduledFor } from "@chowgo/shared/deliveryTime";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import { axiosError, createTestQueryClient, createWrapper } from "@/test/utils";
import Checkout from "../../../app/(customer)/checkout";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock("@/components/feedback/routeErrorBoundary", () => ({
  __esModule: true,
  makeRouteErrorBoundary: () => () => null,
}));
jest.mock("@/features/basket/UpsellRail", () => ({ __esModule: true, UpsellRail: () => null }));
jest.mock("@/features/checkout/PromoCodeField", () => ({ __esModule: true, PromoCodeField: () => null }));
jest.mock("@/features/legal/LegalConsent", () => ({ __esModule: true, LegalConsent: () => null }));
jest.mock("@/notifications/register", () => ({ __esModule: true, registerForPush: jest.fn() }));
jest.mock("@/hooks/Address/useAddresses", () => ({
  __esModule: true,
  useAddresses: () => ({
    isLoading: false,
    data: [{ _id: "a1", label: "Home", fullAddress: "Knez Mihailova 1", isDefault: true }],
  }),
}));
jest.mock("@/hooks/Orders/useOrders", () => ({ __esModule: true, useCreateOrder: jest.fn() }));
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));

const NOW = new Date("2026-10-07T06:00:00Z");
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const week = (hours) => Object.fromEntries(DAYS.map((day) => [day, hours]));
const restaurant = {
  _id: "r1",
  name: "Pekara",
  isActive: true,
  isOpenNow: false,
  currency: "RSD",
  timezone: "Europe/Belgrade",
  estimatedPreparationTime: 30,
  schedule: week({ isOpen: true, openingTime: "10:00", closingTime: "22:00" }),
};
const FIRST_SLOT = new Date("2026-10-07T09:00:00Z");
const TOMORROW_FIRST = new Date("2026-10-08T09:00:00Z");

let mutateAsync;

async function renderCheckout(overrides = {}) {
  useCartStore.setState({
    items: [{ lineId: "m1", menuItem: { _id: "m1" }, name: "Burek", price: 300, quantity: 2 }],
    totalPrice: 600,
    restaurant: { ...restaurant, ...overrides },
    fetchCart: jest.fn(),
    clearLocalCart: jest.fn(),
  });
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Checkout />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
}

const priorityLabel = () => deliveryTypes(t).find((option) => option.value === "priority").label;
const placeOrder = () => fireEvent.press(screen.getByText(t("basket:checkout.placeOrder")));

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  mutateAsync = jest.fn(async () => ({ _id: "o1" }));
  useCreateOrder.mockReturnValue({ mutateAsync, isPending: false });
});

afterEach(() => {
  jest.useRealTimers();
});

it("makes a closed restaurant scheduled-only and sends the chosen slot", async () => {
  await renderCheckout();

  const asap = screen.getByRole("radio", { name: t("basket:schedule.asap") });
  expect(asap).toBeDisabled();
  expect(screen.getByText(t("basket:schedule.required"))).toBeOnTheScreen();
  expect(screen.getByRole("radio", { name: t("basket:schedule.later") })).toBeSelected();

  expect(screen.getByRole("button", { name: t("basket:schedule.today") })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: t("basket:schedule.tomorrow") }));
  await fireEvent.press(screen.getByRole("button", { name: formatTime(TOMORROW_FIRST) }));

  expect(
    screen.getByText(t("basket:schedule.summary", { when: formatScheduledFor(TOMORROW_FIRST, NOW) })),
  ).toBeOnTheScreen();

  await placeOrder();
  await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  expect(mutateAsync.mock.calls[0][0]).toMatchObject({
    restaurantId: "r1",
    deliveryAddressId: "a1",
    deliveryType: "standard",
    scheduledFor: TOMORROW_FIRST.toISOString(),
  });
});

it("refuses to place a scheduled order without a time", async () => {
  await renderCheckout();

  await placeOrder();
  expect(toast.warning).toHaveBeenCalledWith(t("basket:schedule.pickTime"));
  expect(mutateAsync).not.toHaveBeenCalled();
});

it("orders for now by default and turns priority off once scheduling", async () => {
  await renderCheckout({ isOpenNow: true });

  const priority = screen.getByRole("radio", { name: new RegExp(priorityLabel()) });
  expect(priority).not.toBeDisabled();
  await fireEvent.press(priority);

  await fireEvent.press(screen.getByRole("radio", { name: t("basket:schedule.later") }));
  expect(screen.getByRole("radio", { name: new RegExp(priorityLabel()) })).toBeDisabled();
  expect(screen.getByText(t("basket:schedule.priorityOff"))).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole("radio", { name: t("basket:schedule.asap") }));
  await placeOrder();
  await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  expect(mutateAsync.mock.calls[0][0].deliveryType).toBe("priority");
  expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty("scheduledFor");
});

it("drops the slot and shows the server message when it is refused", async () => {
  mutateAsync.mockRejectedValueOnce(
    axiosError(400, { code: "SCHEDULE_TOO_SOON", message: t("errors:order.schedule.SCHEDULE_TOO_SOON") }),
  );
  await renderCheckout();

  await fireEvent.press(screen.getByRole("button", { name: formatTime(FIRST_SLOT) }));
  await placeOrder();

  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.error.mock.calls[0][1].description).toBe(t("errors:order.schedule.SCHEDULE_TOO_SOON"));
  expect(screen.getByRole("button", { name: formatTime(FIRST_SLOT) })).not.toBeSelected();
  expect(useCartStore.getState().fetchCart).toHaveBeenCalled();
});

it("says so when there is no time left to schedule", async () => {
  await renderCheckout({ schedule: week({ isOpen: false, openingTime: "10:00", closingTime: "22:00" }) });

  expect(
    screen.getByText(t("basket:schedule.noSlots", { days: 3 })),
  ).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: t("basket:schedule.today") })).toBeNull();
});

it("clears a chosen time once it is too close to keep", async () => {
  await renderCheckout();

  await fireEvent.press(screen.getByRole("button", { name: formatTime(FIRST_SLOT) }));
  expect(screen.getByRole("button", { name: formatTime(FIRST_SLOT) })).toBeSelected();

  await act(async () => {
    jest.advanceTimersByTime(140 * 60 * 1000);
  });

  expect(screen.queryByRole("button", { name: formatTime(FIRST_SLOT) })).toBeNull();
  expect(screen.queryByText(t("basket:schedule.summary", { when: formatScheduledFor(FIRST_SLOT, NOW) }))).toBeNull();
});
