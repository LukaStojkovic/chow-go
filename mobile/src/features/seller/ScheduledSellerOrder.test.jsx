import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { t } from "@chowgo/shared/i18n";

import {
  cancelRestaurantOrder,
  confirmOrder,
  getRestaurantOrderById,
  rejectOrder,
} from "@/services/apiRestaurantOrder";
import { formatScheduledFor } from "@chowgo/shared/deliveryTime";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import IncomingOrder from "../../../app/(seller)/incoming/[orderId]";
import SellerOrderDetail from "../../../app/(seller)/order/[orderId]";
import { SellerOrderCard } from "./SellerOrderCard";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ orderId: "665f1c2e9b1e8a0012abcdef" }),
}));
jest.mock("@/components/ui/Dialog", () => {
  const { View } = require("react-native");
  return {
    Sheet: ({ visible, children }) => (visible ? <View>{children}</View> : null),
    SheetActions: ({ children }) => <View>{children}</View>,
  };
});
jest.mock("@/features/seller/SellerAlert", () => ({ __esModule: true, silenceAlert: jest.fn() }));
jest.mock("@/services/apiRestaurantOrder", () => ({
  __esModule: true,
  getRestaurantOrderById: jest.fn(),
  rejectOrder: jest.fn(async () => ({})),
  cancelRestaurantOrder: jest.fn(async () => ({})),
  confirmOrder: jest.fn(async () => ({})),
}));
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
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
  items: [{ _id: "l1", name: "Burek", price: 300, quantity: 1 }],
  subtotal: 300,
  total: 700,
  currency: "RSD",
  deliveryAddressSnapshot: { fullAddress: "Knez Mihailova 1" },
};

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderScreen = (Component) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Component />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  getRestaurantOrderById.mockResolvedValue(raw);
});

afterEach(() => {
  jest.useRealTimers();
});

it("offers only a reject on a scheduled order's detail", async () => {
  await renderScreen(SellerOrderDetail);

  expect(await screen.findByText(formatScheduledFor(SLOT, NOW))).toBeOnTheScreen();
  expect(screen.queryByText(t("seller:orders.actions.cancel"))).toBeNull();

  await fireEvent.press(screen.getByText(t("seller:orders.actions.reject")));
  const buttons = await screen.findAllByRole("button", { name: t("seller:orders.actions.reject") });
  await fireEvent.press(buttons[buttons.length - 1]);

  await waitFor(() => expect(rejectOrder).toHaveBeenCalled());
  expect(rejectOrder.mock.calls[0][0]).toBe(raw._id);
  expect(cancelRestaurantOrder).not.toHaveBeenCalled();
});

it("never offers to accept a scheduled order from the takeover", async () => {
  await renderScreen(IncomingOrder);

  expect(await screen.findByText(formatScheduledFor(SLOT, NOW))).toBeOnTheScreen();
  expect(screen.queryByText(t("seller:orders.acceptWithTime", { minutes: 20 }))).toBeNull();
  expect(screen.getByText(t("seller:orders.actions.reject"))).toBeOnTheScreen();
  expect(confirmOrder).not.toHaveBeenCalled();
});

it("shows the booked time on the board without an advance action", async () => {
  await render(
    <SellerOrderCard order={toOrderView(raw)} onPress={jest.fn()} onOpen={jest.fn()} onAdvance={jest.fn()} />,
    { wrapper: createWrapper() },
  );

  expect(screen.getByText(`${t("order:scheduled.title")} ${formatScheduledFor(SLOT, NOW)}`)).toBeOnTheScreen();
  expect(screen.queryByText(t("seller:orders.actions.viewDetails"))).toBeNull();
  expect(screen.queryByText(t("seller:orders.actions.startPreparing"))).toBeNull();
});
