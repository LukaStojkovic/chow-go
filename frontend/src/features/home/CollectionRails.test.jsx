import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHomeCollections } from "@/services/apiCollection";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { renderWithProviders } from "@/test/utils";
import { CollectionRails } from "./CollectionRails";

vi.mock("@/services/apiCollection", () => ({
  getHomeCollections: vi.fn(),
  getCollection: vi.fn(),
}));
vi.mock("@/hooks/Favourites/useFavourites", () => ({
  useFavourites: () => ({ isFavourite: () => false, toggleFavourite: vi.fn(), isPending: false }),
}));

const COORDS = { lat: 44.8, lon: 20.4 };
const restaurant = (id, name) => ({ _id: id, name, cuisineType: "burgers", isActive: true, isOpenNow: true, currency: "RSD" });
const dish = (id, name) => ({
  _id: id,
  name,
  price: 450,
  category: "Burgers",
  restaurant: { _id: "r1", name: "Burger Bar", currency: "RSD", isOpenNow: true },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  useDeliveryStore.setState({ address: "Knez Mihailova 1", coordinates: COORDS });
});

describe("CollectionRails", () => {
  it("renders each rail in order and links to see-all only when there is more", async () => {
    getHomeCollections.mockResolvedValue({
      collections: [
        {
          id: "c1",
          slug: "best-burgers",
          kind: "restaurants",
          title: "Best burgers",
          subtitle: "Stacked high",
          coverImage: null,
          items: [restaurant("r1", "Burger Bar"), restaurant("r2", "Smash"), restaurant("r3", "Patty")],
          total: 9,
          hasMore: true,
        },
        {
          id: "c2",
          slug: "under-500",
          kind: "dishes",
          title: "Under 500 RSD",
          subtitle: null,
          coverImage: null,
          items: [dish("d1", "Cheeseburger"), dish("d2", "Fries"), dish("d3", "Shake")],
          total: 3,
          hasMore: false,
        },
      ],
    });
    const onAddDish = vi.fn();

    renderWithProviders(<CollectionRails onAddDish={onAddDish} />);

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Best burgers", "Under 500 RSD"]);
    expect(screen.getByText("Stacked high")).toBeInTheDocument();
    expect(getHomeCollections).toHaveBeenCalledWith({ lat: COORDS.lat, lon: COORDS.lon });

    const seeAll = screen.getAllByRole("link", { name: /See all in/ });
    expect(seeAll).toHaveLength(1);
    expect(seeAll[0]).toHaveAttribute("href", "/collections/best-burgers");

    expect(screen.getByText("Smash")).toBeInTheDocument();
    expect(screen.getByText("Cheeseburger")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: /add to basket/i })[0]);
    await waitFor(() => expect(onAddDish).toHaveBeenCalledWith(expect.objectContaining({ id: "d1" })));
  });

  it("renders nothing when the request fails", async () => {
    getHomeCollections.mockRejectedValue(new Error("boom"));
    const { container } = renderWithProviders(<CollectionRails onAddDish={vi.fn()} />);
    await waitFor(() => expect(container.querySelector("[aria-busy]")).toBeNull());
    expect(container).toBeEmptyDOMElement();
  });
});
