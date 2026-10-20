import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "@chowgo/shared/i18n";

import { confirmOrder, getRestaurantOrderById } from "@/services/apiRestaurantOrder";
import { getRestaurantStatus } from "@/services/apiRestaurantStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import IncomingOrder from "../../../app/(seller)/incoming/[orderId]";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ orderId: "o1" }),
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
  confirmOrder: jest.fn(async () => ({})),
}));
jest.mock("@/services/apiRestaurantStatus", () => ({
  __esModule: true,
  getRestaurantStatus: jest.fn(),
  setRestaurantStatus: jest.fn(),
}));
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));

const order = {
  _id: "o1",
  status: "pending",
  createdAt: new Date().toISOString(),
  items: [{ _id: "l1", name: "Burek", price: 300, quantity: 1 }],
  subtotal: 300,
  total: 700,
  currency: "RSD",
  deliveryAddressSnapshot: { fullAddress: "Knez Mihailova 1" },
};
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] } });
  getRestaurantOrderById.mockResolvedValue(order);
});

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <IncomingOrder />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );

it("defaults the prep time to 30 plus the busy minutes", async () => {
  getRestaurantStatus.mockResolvedValue({
    isActive: true,
    scheduleOpen: true,
    closure: null,
    pause: null,
    busy: { extraMinutes: 15, until: new Date(Date.now() + 3600000).toISOString() },
  });
  await renderScreen();

  await fireEvent.press(await screen.findByText(t("seller:orders.acceptWithTime", { minutes: 45 })));
  await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith("o1", 45));
});

it("keeps the usual default when not busy", async () => {
  getRestaurantStatus.mockResolvedValue({ isActive: true, scheduleOpen: true, pause: null, busy: null });
  await renderScreen();

  expect(await screen.findByText(t("seller:orders.acceptWithTime", { minutes: 20 }))).toBeOnTheScreen();
});
