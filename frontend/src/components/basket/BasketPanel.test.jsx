import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import useCartStore from "@/store/useCartStore";
import { renderWithProviders } from "@/test/utils";
import { BasketPanel } from "./BasketPanel";

const line = (lineId, optionName) => ({
  lineId,
  menuItem: { _id: "m1", name: "Burger" },
  name: "Burger",
  price: 900,
  quantity: 1,
  options: [{ groupId: "g1", groupName: "Size", optionId: lineId.split("~")[1], name: optionName, priceDelta: 0 }],
});

describe("BasketPanel quantity sync", () => {
  let updateItemQuantity;

  beforeEach(() => {
    vi.useFakeTimers();
    updateItemQuantity = vi.fn(() => Promise.resolve());
    useCartStore.setState({
      items: [line("m1~o1", "Regular"), line("m1~o2", "Large")],
      totalPrice: 1800,
      restaurant: { _id: "r1", name: "R", currency: "RSD" },
      isLoading: false,
      fetchCart: vi.fn(() => Promise.resolve()),
      updateItemQuantity,
      removeItem: vi.fn(() => Promise.resolve()),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const increaseButtons = () =>
    screen.getAllByRole("button", { name: t("common:a11y.increaseQuantityOf", { name: "Burger" }) });

  it("sends both lines when two are changed inside the debounce window", () => {
    renderWithProviders(<BasketPanel isOpen onClose={() => {}} />);

    const [regular, large] = increaseButtons();
    fireEvent.click(regular);
    fireEvent.click(large);
    act(() => vi.advanceTimersByTime(300));

    expect(updateItemQuantity).toHaveBeenCalledTimes(2);
    expect(updateItemQuantity).toHaveBeenCalledWith("m1~o1", 2);
    expect(updateItemQuantity).toHaveBeenCalledWith("m1~o2", 2);
  });

  it("still sends a change when the basket closes before it was due", () => {
    const { unmount } = renderWithProviders(<BasketPanel isOpen onClose={() => {}} />);

    fireEvent.click(increaseButtons()[1]);
    unmount();

    expect(updateItemQuantity).toHaveBeenCalledWith("m1~o2", 2);
  });
});
