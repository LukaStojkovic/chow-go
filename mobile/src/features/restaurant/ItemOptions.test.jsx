import { fireEvent, render, screen } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useCartStore } from "@/store/useCartStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import ItemCustomization from "../../../app/(customer)/item/[menuItemId]";
import { toggleOption } from "./OptionGroupPicker";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ menuItemId: "m1", restaurantId: "r1" }),
}));

const dish = {
  _id: "m1",
  name: "Pizza",
  price: 10,
  currency: "EUR",
  optionGroups: [
    {
      _id: "g1",
      name: "Size",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { _id: "small", name: "Small", priceDelta: 0 },
        { _id: "large", name: "Large", priceDelta: 2.5 },
      ],
    },
    {
      _id: "g2",
      name: "Extras",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { _id: "cheese", name: "Cheese", priceDelta: 1 },
        { _id: "olives", name: "Olives", priceDelta: 0.5 },
        { _id: "ham", name: "Ham", priceDelta: 1.5, available: false },
      ],
    },
  ],
};

const price = (amount) => formatPrice(amount, { currency: "EUR" });
const addButton = (amount) => screen.getByRole("button", { name: t("basket:addItem", { price: price(amount) }) });

async function renderSheet() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(["restaurantMenu", "r1"], [{ category: "pizza", items: [dish] }]);
  const addItem = jest.fn(async () => ({ status: "added" }));
  useCartStore.setState({ addItem });
  const Wrapper = createWrapper(queryClient);
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ItemCustomization />
    </SafeAreaProvider>,
    { wrapper: Wrapper },
  );
  return addItem;
}

describe("item options", () => {
  it("blocks adding until the required group has a pick", async () => {
    const addItem = await renderSheet();
    expect(screen.getByText(t("restaurant:options.pickRequired", { group: "Size" }))).toBeOnTheScreen();
    expect(addButton(10)).toBeDisabled();

    await fireEvent.press(addButton(10));
    expect(addItem).not.toHaveBeenCalled();
  });

  it("updates the price and passes the option ids to the basket", async () => {
    const addItem = await renderSheet();

    await fireEvent.press(screen.getByRole("radio", { name: "Large" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Cheese" }));
    expect(screen.getByRole("radio", { name: "Large" })).toBeChecked();
    expect(screen.queryByText(t("restaurant:options.pickRequired", { group: "Size" }))).toBeNull();

    await fireEvent.press(addButton(13.5));
    expect(addItem).toHaveBeenCalledWith("m1", 1, undefined, ["large", "cheese"]);
  });

  it("disables sold-out options", async () => {
    await renderSheet();
    expect(screen.getByRole("checkbox", { name: "Ham" })).toBeDisabled();
    expect(screen.getByText(t("restaurant:options.soldOut"))).toBeOnTheScreen();
  });
});

describe("toggleOption", () => {
  const groups = [
    { id: "g1", isSingle: true, isRequired: true, maxSelect: 1, options: [{ id: "a" }, { id: "b" }] },
    { id: "g2", isSingle: false, isRequired: false, maxSelect: 2, options: [{ id: "x" }, { id: "y" }, { id: "z" }] },
    { id: "g3", isSingle: true, isRequired: false, maxSelect: 1, options: [{ id: "p" }] },
  ];

  it("swaps a single choice and keeps a required one selected", () => {
    expect(toggleOption(groups, ["a", "x"], "g1", "b")).toEqual(["x", "b"]);
    expect(toggleOption(groups, ["a"], "g1", "a")).toEqual(["a"]);
  });

  it("lets an optional single choice be cleared", () => {
    expect(toggleOption(groups, ["p"], "g3", "p")).toEqual([]);
  });

  it("caps a multi-select at its maximum", () => {
    expect(toggleOption(groups, ["x", "y"], "g2", "z")).toEqual(["x", "y"]);
    expect(toggleOption(groups, ["x", "y"], "g2", "x")).toEqual(["y"]);
  });
});
