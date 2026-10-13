import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { rateOrder } from "@/services/apiOrder";
import { renderWithProviders } from "@/test/utils";
import { OrderRating } from "./OrderRating";

vi.mock("@/services/apiOrder", () => ({ rateOrder: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const order = {
  id: "o1",
  restaurant: { name: "Pizza Place" },
  courier: { name: "Ana" },
  rating: null,
};

const star = (count, index = 0) =>
  screen.getAllByRole("radio", { name: t("common:count.stars", { count }) })[index];
const tag = (id) => screen.queryByRole("button", { name: t(`restaurant:reviews.tags.${id}`) });

describe("OrderRating tags", () => {
  beforeEach(() => {
    rateOrder.mockReset();
    rateOrder.mockResolvedValue({});
  });

  it("offers no tags until stars are picked, then the ones that fit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderRating order={order} />);
    expect(screen.queryByText(t("restaurant:reviews.tagsPrompt"))).not.toBeInTheDocument();

    await user.click(star(5));
    expect(tag("tasty")).toBeInTheDocument();
    expect(tag("arrived_cold")).not.toBeInTheDocument();

    await user.click(star(2));
    expect(tag("arrived_cold")).toBeInTheDocument();
    expect(tag("tasty")).not.toBeInTheDocument();
  });

  it("sends picked tags and drops ones that no longer fit the stars", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderRating order={order} />);

    await user.click(star(5));
    await user.click(tag("tasty"));
    expect(tag("tasty")).toHaveAttribute("aria-pressed", "true");

    await user.click(star(4));
    await user.click(tag("good_value"));

    await user.click(star(5, 1));
    await user.click(tag("fast"));

    await user.click(screen.getByRole("button", { name: t("order:rating.submit") }));
    await waitFor(() => expect(rateOrder).toHaveBeenCalled());
    expect(rateOrder.mock.calls[0][1]).toEqual({
      restaurantRating: 4,
      restaurantTags: ["tasty", "good_value"],
      courierRating: 5,
      courierTags: ["fast"],
    });
  });

  it("clears tags when the rating crosses from praise to a complaint", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderRating order={{ ...order, courier: null }} />);

    await user.click(star(5));
    await user.click(tag("tasty"));
    await user.click(star(3));
    await user.click(tag("wrong_order"));

    await user.click(screen.getByRole("button", { name: t("order:rating.submit") }));
    await waitFor(() => expect(rateOrder).toHaveBeenCalled());
    expect(rateOrder.mock.calls[0][1]).toEqual({
      restaurantRating: 3,
      restaurantTags: ["wrong_order"],
    });
  });
});
