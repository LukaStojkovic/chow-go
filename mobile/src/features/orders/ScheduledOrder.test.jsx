import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { t } from "@chowgo/shared/i18n";

import { useCancelOrder, useOrder } from "@/hooks/Orders/useOrders";
import { formatScheduledFor } from "@chowgo/shared/deliveryTime";
import { createWrapper } from "@/test/utils";
import OrderTracking from "../../../app/(customer)/order/[orderId]/index";
import { OrderCard } from "./OrderCard";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ orderId: "665f1c2e9b1e8a0012abcdef" }),
}));
jest.mock("@/components/feedback/routeErrorBoundary", () => ({
  __esModule: true,
  makeRouteErrorBoundary: () => () => null,
}));
jest.mock("@/features/orders/OrderTrackingMap", () => ({ __esModule: true, OrderTrackingMap: () => null }));
jest.mock("@/hooks/Orders/useOrders", () => ({
  __esModule: true,
  useOrder: jest.fn(),
  useCancelOrder: jest.fn(),
}));

const NOW = new Date("2026-10-07T06:00:00Z");
const SLOT = "2026-10-08T09:00:00.000Z";
const raw = {
  _id: "665f1c2e9b1e8a0012abcdef",
  status: "scheduled",
  scheduledFor: SLOT,
  estimatedDeliveryTime: SLOT,
  estimatedPreparationTime: 30,
  createdAt: NOW.toISOString(),
  restaurant: { _id: "r1", name: "Pekara" },
  items: [{ _id: "l1", name: "Burek", price: 300, quantity: 1 }],
  subtotal: 300,
  total: 700,
  currency: "RSD",
};

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(NOW);
  useOrder.mockReturnValue({ data: raw, isLoading: false, isError: false, refetch: jest.fn() });
  useCancelOrder.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
});

afterEach(() => {
  jest.useRealTimers();
});

it("shows the booked time instead of a countdown and keeps cancel available", async () => {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <OrderTracking />
    </SafeAreaProvider>,
    { wrapper: createWrapper() },
  );

  expect(screen.getByText(t("order:scheduled.title"))).toBeOnTheScreen();
  expect(screen.getByText(formatScheduledFor(SLOT, NOW))).toBeOnTheScreen();
  expect(screen.getByText(t("order:scheduled.cancelHint"))).toBeOnTheScreen();
  expect(screen.queryByText(t("order:eta.label"))).toBeNull();
  expect(screen.getByRole("button", { name: t("order:actions.cancel") })).toBeOnTheScreen();
});

it("puts the booked day and time on the order card", async () => {
  await render(<OrderCard order={toOrderView(raw)} onPress={jest.fn()} />, { wrapper: createWrapper() });

  expect(screen.getByText(formatScheduledFor(SLOT, NOW))).toBeOnTheScreen();
  expect(screen.getByText(t("order:status.scheduled.label"))).toBeOnTheScreen();
});
