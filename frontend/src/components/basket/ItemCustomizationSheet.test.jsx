import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toDishView } from "@chowgo/shared/adapters/menu";

import useCartStore from "@/store/useCartStore";
import { renderWithProviders } from "@/test/utils";
import { ItemCustomizationSheet } from "./ItemCustomizationSheet";

const dish = toDishView({
  _id: "d1",
  name: "Burger",
  price: 10,
  currency: "EUR",
  optionGroups: [
    {
      _id: "g-size",
      name: "Size",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { _id: "o-regular", name: "Regular", priceDelta: 0 },
        { _id: "o-large", name: "Large", priceDelta: 2.5 },
        { _id: "o-huge", name: "Huge", priceDelta: 5, available: false },
      ],
    },
    {
      _id: "g-extras",
      name: "Extras",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { _id: "o-cheese", name: "Cheese", priceDelta: 1 },
        { _id: "o-bacon", name: "Bacon", priceDelta: 1.5 },
        { _id: "o-egg", name: "Egg", priceDelta: 1 },
      ],
    },
  ],
});

let addItem;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  addItem = vi.fn().mockResolvedValue(true);
  useCartStore.setState({ addItem, pendingConflict: null, restaurant: null });
});

function renderSheet() {
  const onClose = vi.fn();
  renderWithProviders(<ItemCustomizationSheet dish={dish} onClose={onClose} />);
  return { onClose, user: userEvent.setup() };
}

const addButton = () => screen.getByRole("button", { name: /add to basket/i });

describe("ItemCustomizationSheet with options", () => {
  it("blocks Add until the required group has a pick, and says which group", async () => {
    const { user } = renderSheet();

    expect(addButton()).toBeDisabled();
    expect(screen.getByText("Pick an option for Size")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /huge/i })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /regular/i }));
    expect(addButton()).toBeEnabled();
    expect(screen.queryByText("Pick an option for Size")).not.toBeInTheDocument();
  });

  it("updates the price as options are picked", async () => {
    const { user } = renderSheet();
    expect(addButton()).toHaveTextContent("€10.00");

    await user.click(screen.getByRole("radio", { name: /large/i }));
    await user.click(screen.getByRole("checkbox", { name: /bacon/i }));
    expect(addButton()).toHaveTextContent("€14.00");

    await user.click(screen.getByRole("button", { name: /increase/i }));
    expect(addButton()).toHaveTextContent("€28.00");
  });

  it("stops checkboxes at the group maximum", async () => {
    const { user } = renderSheet();
    await user.click(screen.getByRole("checkbox", { name: /cheese/i }));
    await user.click(screen.getByRole("checkbox", { name: /bacon/i }));
    expect(screen.getByRole("checkbox", { name: /egg/i })).toBeDisabled();
  });

  it("sends the picked option ids to the cart", async () => {
    const { user, onClose } = renderSheet();
    await user.click(screen.getByRole("radio", { name: /large/i }));
    await user.click(screen.getByRole("checkbox", { name: /cheese/i }));
    await user.click(addButton());

    expect(addItem).toHaveBeenCalledWith("d1", 1, undefined, ["o-large", "o-cheese"]);
    expect(onClose).toHaveBeenCalled();
  });
});
