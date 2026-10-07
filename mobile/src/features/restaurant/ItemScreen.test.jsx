import { fireEvent, render, screen } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getRestaurantInfo, getRestaurantMenu } from "@/services/apiRestaurant";
import { useCartStore } from "@/store/useCartStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import ItemCustomization from "../../../app/(customer)/item/[menuItemId]";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ menuItemId: "m1", restaurantId: "r1" }),
}));
jest.mock("@/services/apiRestaurant", () => ({
  __esModule: true,
  getRestaurantInfo: jest.fn(),
  getRestaurantMenu: jest.fn(),
}));

const dish = { _id: "m1", name: "Burek", description: "Flaky", price: 300, currency: "RSD" };
const open = { _id: "r1", name: "Pekara", isActive: true, isOpenNow: true, currency: "RSD" };

async function renderScreen() {
  const addItem = jest.fn(async () => ({ status: "added" }));
  useCartStore.setState({ addItem });
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ItemCustomization />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
  return addItem;
}

const addLabel = t("basket:addItem", { price: formatPrice(300, { currency: "RSD" }) });

beforeEach(() => {
  jest.clearAllMocks();
  getRestaurantInfo.mockResolvedValue(open);
  getRestaurantMenu.mockResolvedValue([{ category: "Breakfast", items: [dish] }]);
});

it("loads the menu itself when opened cold, without the restaurant page first", async () => {
  const addItem = await renderScreen();

  expect(await screen.findByText("Burek")).toBeOnTheScreen();
  expect(getRestaurantMenu).toHaveBeenCalledWith("r1");

  await fireEvent.press(await screen.findByRole("button", { name: addLabel }));
  expect(addItem).toHaveBeenCalledWith("m1", 1, undefined, []);
});

it("says the dish is gone only once the menu has loaded without it", async () => {
  getRestaurantMenu.mockResolvedValue([{ category: "Breakfast", items: [] }]);
  await renderScreen();

  expect(await screen.findByText(t("errors:cart.menuItemNotFound"))).toBeOnTheScreen();
});

it("offers a retry when the menu cannot be loaded", async () => {
  getRestaurantMenu.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([{ category: "Breakfast", items: [dish] }]);
  await renderScreen();

  await fireEvent.press(await screen.findByRole("button", { name: t("common:actions.retry") }));
  expect(await screen.findByText("Burek")).toBeOnTheScreen();
});

it("will not add from a closed restaurant and says why", async () => {
  getRestaurantInfo.mockResolvedValue({ ...open, isOpenNow: false });
  const addItem = await renderScreen();

  const button = await screen.findByRole("button", { name: t("restaurant:availability.closedNow") });
  expect(button).toBeDisabled();
  expect(screen.getByText(t("restaurant:availability.closedNoSlot"))).toBeOnTheScreen();

  await fireEvent.press(button);
  expect(addItem).not.toHaveBeenCalled();
});

it("treats a restaurant that is not taking orders the same way", async () => {
  getRestaurantInfo.mockResolvedValue({ ...open, isActive: false });
  await renderScreen();

  expect(await screen.findByText(t("restaurant:availability.notAccepting"))).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: t("restaurant:availability.closedNow") })).toBeDisabled();
});
