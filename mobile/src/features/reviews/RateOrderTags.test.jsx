import { fireEvent, render, screen } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { rateOrder } from "@/services/apiOrder";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import RateOrder from "../../../app/(customer)/order/[orderId]/rate";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ orderId: "o1" }),
}));
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));
jest.mock("@/services/apiOrder", () => ({ __esModule: true, rateOrder: jest.fn() }));
jest.mock("@/hooks/Orders/useOrders", () => ({
  __esModule: true,
  useOrder: () => ({
    data: {
      _id: "o1",
      status: "delivered",
      restaurant: { _id: "r1", name: "Burger Bar" },
      courier: { _id: "c1", userId: { name: "Pera Peric" } },
      items: [],
    },
  }),
}));

const tag = (id) => t(`restaurant:reviews.tags.${id}`, { defaultValue: id });
const star = (count, index) => screen.getAllByRole("button", { name: t("common:count.stars", { count }) })[index];

async function renderScreen() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <RateOrder />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  rateOrder.mockResolvedValue({ status: "success" });
});

it("offers tags only after stars, praise for 4-5 and problems for 1-3", async () => {
  await renderScreen();
  expect(screen.queryByText(t("restaurant:reviews.tagsPrompt"))).toBeNull();

  await fireEvent.press(star(5, 0));
  expect(screen.getByText(tag("tasty"))).toBeOnTheScreen();
  expect(screen.queryByText(tag("arrived_cold"))).toBeNull();

  await fireEvent.press(star(2, 0));
  expect(screen.getByText(tag("arrived_cold"))).toBeOnTheScreen();
  expect(screen.queryByText(tag("tasty"))).toBeNull();
});

it("drops picks that no longer fit and sends the rest with the rating", async () => {
  await renderScreen();

  await fireEvent.press(star(5, 0));
  await fireEvent.press(screen.getByRole("button", { name: tag("tasty") }));
  await fireEvent.press(screen.getByRole("button", { name: tag("good_value") }));
  expect(screen.getByRole("button", { name: tag("tasty") })).toBeSelected();

  await fireEvent.press(star(4, 0));
  await fireEvent.press(screen.getByRole("button", { name: tag("good_value") }));

  await fireEvent.press(star(2, 0));
  await fireEvent.press(screen.getByRole("button", { name: tag("missing_items") }));
  await fireEvent.press(star(5, 0));
  expect(screen.getByRole("button", { name: tag("tasty") })).not.toBeSelected();
  await fireEvent.press(screen.getByRole("button", { name: tag("tasty") }));

  await fireEvent.press(star(4, 1));
  await fireEvent.press(screen.getByRole("button", { name: tag("fast") }));

  await fireEvent.press(screen.getByRole("button", { name: t("order:rating.submit") }));

  expect(rateOrder).toHaveBeenCalledWith(
    "o1",
    expect.objectContaining({
      restaurantRating: 5,
      restaurantTags: ["tasty"],
      courierRating: 4,
      courierTags: ["fast"],
    }),
  );
});
