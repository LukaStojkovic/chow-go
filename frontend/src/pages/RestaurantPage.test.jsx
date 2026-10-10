import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toRestaurantView } from "@chowgo/shared/adapters/restaurant";
import { toMenuSections } from "@chowgo/shared/adapters/menu";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { renderWithProviders } from "@/test/utils";
import RestaurantPage from "./RestaurantPage";

vi.mock("@/hooks/Restaurants/useRestaurant", () => ({ useRestaurant: vi.fn() }));
vi.mock("@/hooks/Favourites/useFavourites", () => ({
  useFavourites: () => ({ isFavourite: () => false, toggleFavourite: vi.fn(), isPending: false }),
}));

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const week = (isOpen) =>
  Object.fromEntries(DAYS.map((day) => [day, { isOpen, openingTime: "00:00", closingTime: "00:00" }]));

const menu = [
  {
    category: "Pizza",
    items: [{ _id: "d1", name: "Margherita", price: 900, available: true }],
  },
];

function mockRestaurant(overrides) {
  const raw = {
    _id: "r1",
    name: "Night Kitchen",
    isActive: true,
    isOpenNow: false,
    timezone: "Europe/Belgrade",
    currency: "RSD",
    ...overrides,
  };
  useRestaurant.mockReturnValue({
    restaurant: toRestaurantView(raw),
    rawRestaurant: raw,
    menu: toMenuSections(menu),
    isLoadingRestaurant: false,
    isLoadingMenu: false,
    error: null,
    refetch: vi.fn(),
  });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

describe("RestaurantPage pre-orders", () => {
  it("lets a closed restaurant with delivery slots take dishes for later", async () => {
    mockRestaurant({ schedule: week(true) });
    renderWithProviders(<RestaurantPage />);

    const dish = screen.getByRole("button", { name: /Margherita/ });
    expect(dish).toBeEnabled();
    expect(screen.getAllByText("Closed now. Order ahead for later.").length).toBeGreaterThan(0);
    expect(screen.getByText("Order ahead")).toBeInTheDocument();

    await userEvent.setup().click(dish);
    expect(await screen.findByRole("dialog")).toHaveTextContent("Closed now. Order ahead for later.");
    expect(screen.getByRole("button", { name: /add to basket/i })).toBeEnabled();
  });

  it("keeps blocking a closed restaurant with no slots", () => {
    mockRestaurant({ schedule: week(false) });
    renderWithProviders(<RestaurantPage />);

    expect(screen.getByRole("button", { name: /Margherita/ })).toBeDisabled();
    expect(screen.queryByText("Order ahead")).not.toBeInTheDocument();
  });

  it("keeps blocking an inactive restaurant even with slots", () => {
    mockRestaurant({ schedule: week(true), isActive: false });
    renderWithProviders(<RestaurantPage />);

    expect(screen.getByRole("button", { name: /Margherita/ })).toBeDisabled();
  });
});
