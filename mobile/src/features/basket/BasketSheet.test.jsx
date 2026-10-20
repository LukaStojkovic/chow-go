import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useCartStore } from "@/store/useCartStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import Basket from "../../../app/(customer)/basket";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), dismiss: jest.fn(), dismissTo: jest.fn() },
}));
jest.mock("@/features/basket/UpsellRail", () => ({ UpsellRail: () => null }));

const restaurant = { _id: "r1", name: "Pekara", isActive: true, isOpenNow: true, currency: "RSD" };
const items = [
  { lineId: "m1", menuItem: { _id: "m1" }, name: "Burek", price: 300, quantity: 2 },
  { lineId: "m2", menuItem: { _id: "m2" }, name: "Jogurt", price: 120, quantity: 1 },
];

async function renderBasket() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Basket />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useCartStore.setState({ items, totalPrice: 720, restaurant });
});

it("pins checkout with the basket total and leaves the sheet for checkout", async () => {
  await renderBasket();
  const total = formatPrice(buildPriceBreakdown({ subtotal: 720, currency: "RSD" }).total, { currency: "RSD" });

  const button = screen.getByRole("button", { name: new RegExp(t("basket:goToCheckout")) });
  expect(within(button).getByText(total)).toBeOnTheScreen();
  await fireEvent.press(button);

  expect(router.dismiss).toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith("/(customer)/checkout");
});

it("returns to the restaurant rather than stacking it on the sheet", async () => {
  await renderBasket();

  await fireEvent.press(screen.getByRole("button", { name: t("basket:addMore") }));
  expect(router.dismissTo).toHaveBeenCalledWith("/(customer)/restaurant/r1");
});

it("will not check out from a restaurant that is not taking orders", async () => {
  useCartStore.setState({ restaurant: { ...restaurant, isActive: false } });
  await renderBasket();

  expect(screen.getByRole("button", { name: new RegExp(t("basket:goToCheckout")) })).toBeDisabled();
});
