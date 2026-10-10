import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { router } from "expo-router";

import { getCartSuggestions } from "@/services/apiCart";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import { UpsellRail } from "./UpsellRail";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("@/services/apiCart", () => ({ __esModule: true, getCartSuggestions: jest.fn() }));
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));

const cola = {
  _id: "d1",
  name: "Cola",
  price: 150,
  currency: "RSD",
  restaurant: "r1",
  reason: "drink",
};
const pizza = {
  _id: "d2",
  name: "Pizza",
  price: 900,
  currency: "RSD",
  restaurant: "r1",
  reason: "together",
  optionGroups: [
    {
      _id: "g1",
      name: "Size",
      minSelect: 1,
      maxSelect: 1,
      options: [{ _id: "o1", name: "Large", priceDelta: 200 }],
    },
  ],
};

let addItem;

async function renderRail() {
  const queryClient = createTestQueryClient();
  await render(<UpsellRail />, { wrapper: createWrapper(queryClient) });
  return queryClient;
}

async function settled(queryClient, status) {
  await waitFor(() =>
    expect(
      queryClient.getQueryCache().findAll({ queryKey: ["cartSuggestions"] })[0]?.state.status,
    ).toBe(status),
  );
  await act(async () => {});
}

beforeEach(() => {
  jest.clearAllMocks();
  addItem = jest.fn(async () => ({ status: "added" }));
  useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
  useCartStore.setState({
    items: [{ lineId: "m9", menuItem: "m9", quantity: 1, price: 500 }],
    restaurant: { _id: "r1" },
    addItem,
  });
});

describe("UpsellRail", () => {
  it("renders cards with their reason labels", async () => {
    getCartSuggestions.mockResolvedValue([cola, pizza]);
    await renderRail();

    expect(await screen.findByText(t("basket:upsell.title"))).toBeOnTheScreen();
    expect(screen.getByText("Cola")).toBeOnTheScreen();
    expect(screen.getByText(t("basket:upsell.drink"))).toBeOnTheScreen();
    expect(screen.getByText(t("basket:upsell.together"))).toBeOnTheScreen();
  });

  it("adds a plain dish straight to the basket", async () => {
    getCartSuggestions.mockResolvedValue([cola]);
    await renderRail();

    await fireEvent.press(
      await screen.findByRole("button", { name: t("basket:upsell.add", { name: "Cola" }) }),
    );

    await waitFor(() => expect(addItem).toHaveBeenCalledWith("d1", 1));
    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(t("basket:upsell.added", { name: "Cola" })),
    );
  });

  it("opens the item sheet for a dish with options", async () => {
    getCartSuggestions.mockResolvedValue([pizza]);
    await renderRail();

    await fireEvent.press(
      await screen.findByRole("button", { name: t("basket:upsell.choose", { name: "Pizza" }) }),
    );

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/(customer)/item/[menuItemId]",
      params: { menuItemId: "d2", restaurantId: "r1" },
    });
    expect(addItem).not.toHaveBeenCalled();
  });

  it("renders nothing for an empty list", async () => {
    getCartSuggestions.mockResolvedValue([]);
    await settled(await renderRail(), "success");
    expect(screen.queryByText(t("basket:upsell.title"))).toBeNull();
  });

  it("renders nothing when the request fails", async () => {
    getCartSuggestions.mockRejectedValue(new Error("boom"));
    await settled(await renderRail(), "error");
    expect(screen.queryByText(t("basket:upsell.title"))).toBeNull();
  });

  it("does not ask while the basket is empty", async () => {
    useCartStore.setState({ items: [] });
    getCartSuggestions.mockResolvedValue([cola]);
    await renderRail();

    expect(getCartSuggestions).not.toHaveBeenCalled();
    expect(screen.queryByText(t("basket:upsell.title"))).toBeNull();
  });
});
