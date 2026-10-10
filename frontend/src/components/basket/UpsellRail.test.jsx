import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import useCartStore from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getCartSuggestions } from "@/services/apiCart";
import { renderWithProviders } from "@/test/utils";
import { UpsellRail } from "./UpsellRail";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/apiCart", () => ({ getCartSuggestions: vi.fn() }));
vi.mock("./ItemCustomizationSheet", () => ({
  ItemCustomizationSheet: ({ dish }) => (dish ? <div data-testid="sheet">{dish.name}</div> : null),
}));

const lines = [{ id: "m1", menuItemId: "m1", name: "Burger" }];

const cola = { _id: "d1", name: "Cola", price: 200, currency: "RSD", reason: "drink" };
const fries = { _id: "d2", name: "Fries", price: 300, currency: "RSD", reason: "together" };
const pizza = {
  _id: "d3",
  name: "Pizza",
  price: 900,
  currency: "RSD",
  reason: "together",
  optionGroups: [
    { _id: "g1", name: "Size", minSelect: 1, maxSelect: 1, options: [{ _id: "o1", name: "Large", priceDelta: 100 }] },
  ],
};

const respond = (suggestions) =>
  getCartSuggestions.mockResolvedValue({ status: "success", data: { suggestions } });

describe("UpsellRail", () => {
  let addItem;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    addItem = vi.fn(() => Promise.resolve(true));
    useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
    useCartStore.setState({ addItem });
  });

  it("renders a card per suggestion with its reason", async () => {
    respond([cola, fries]);
    renderWithProviders(<UpsellRail lines={lines} />);

    expect(await screen.findByText("Cola")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
    expect(screen.getByText(t("basket:upsell.title"))).toBeInTheDocument();
    expect(screen.getByText(t("basket:upsell.drink"))).toBeInTheDocument();
    expect(screen.getByText(t("basket:upsell.together"))).toBeInTheDocument();
  });

  it("adds a plain dish straight to the basket", async () => {
    respond([cola]);
    renderWithProviders(<UpsellRail lines={lines} />);

    fireEvent.click(await screen.findByRole("button", { name: t("basket:upsell.add", { name: "Cola" }) }));

    await waitFor(() => expect(addItem).toHaveBeenCalledWith("d1", 1));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(t("basket:upsell.added", { name: "Cola" })),
    );
    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
  });

  it("opens the customisation sheet for a dish with options", async () => {
    respond([pizza]);
    renderWithProviders(<UpsellRail lines={lines} />);

    fireEvent.click(
      await screen.findByRole("button", { name: t("basket:upsell.choose", { name: "Pizza" }) }),
    );

    expect(screen.getByTestId("sheet")).toHaveTextContent("Pizza");
    expect(addItem).not.toHaveBeenCalled();
  });

  it("renders nothing when there are no suggestions", async () => {
    respond([]);
    const { container } = renderWithProviders(<UpsellRail lines={lines} />);

    await waitFor(() => expect(getCartSuggestions).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the request fails", async () => {
    getCartSuggestions.mockRejectedValue(new Error("boom"));
    const { container } = renderWithProviders(<UpsellRail lines={lines} />);

    await waitFor(() => expect(getCartSuggestions).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("does not ask for suggestions while the basket is empty", () => {
    renderWithProviders(<UpsellRail lines={[]} />);

    expect(getCartSuggestions).not.toHaveBeenCalled();
  });
});
