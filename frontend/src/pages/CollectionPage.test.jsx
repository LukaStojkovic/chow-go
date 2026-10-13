import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCollection } from "@/services/apiCollection";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import { CollectionPage } from "./CollectionPage";

vi.mock("@/services/apiCollection", () => ({
  getHomeCollections: vi.fn(),
  getCollection: vi.fn(),
}));
vi.mock("@/hooks/Favourites/useFavourites", () => ({
  useFavourites: () => ({ isFavourite: () => false, toggleFavourite: vi.fn(), isPending: false }),
}));
vi.mock("@/components/basket/ItemCustomizationSheet", () => ({
  ItemCustomizationSheet: () => null,
}));

const COORDS = { lat: 44.8, lon: 20.4 };
const COLLECTION = {
  id: "c1",
  slug: "best-burgers",
  kind: "restaurants",
  title: "Best burgers",
  subtitle: "Stacked high",
  coverImage: null,
};
const restaurant = (id, name) => ({ _id: id, name, cuisineType: "burgers", isActive: true, isOpenNow: true, currency: "RSD" });

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderAt(route) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/" element={<p>landing</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useDeliveryStore.setState({ address: "Knez Mihailova 1", coordinates: COORDS });
});

describe("CollectionPage", () => {
  it("shows the header and pages through the list", async () => {
    getCollection
      .mockResolvedValueOnce({
        collection: COLLECTION,
        items: [restaurant("r1", "Burger Bar"), restaurant("r2", "Smash")],
        pagination: { page: 1, limit: 24, total: 3, hasNext: true },
      })
      .mockResolvedValueOnce({
        collection: COLLECTION,
        items: [restaurant("r3", "Patty")],
        pagination: { page: 2, limit: 24, total: 3, hasNext: false },
      });

    renderAt("/collections/best-burgers");

    expect(await screen.findByRole("heading", { level: 1, name: "Best burgers" })).toBeInTheDocument();
    expect(screen.getByText("Stacked high")).toBeInTheDocument();
    expect(screen.getByText("3 restaurants")).toBeInTheDocument();
    expect(screen.getByText("Smash")).toBeInTheDocument();
    expect(getCollection).toHaveBeenCalledWith("best-burgers", { lat: COORDS.lat, lon: COORDS.lon, page: 1, limit: 24 });

    await userEvent.click(screen.getByRole("button", { name: "Show more" }));

    expect(await screen.findByText("Patty")).toBeInTheDocument();
    expect(getCollection).toHaveBeenLastCalledWith("best-burgers", expect.objectContaining({ page: 2 }));
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("shows the not-found state with a way back", async () => {
    getCollection.mockRejectedValue(axiosError(404, { code: "COLLECTION_NOT_FOUND" }));

    renderAt("/collections/gone");

    expect(await screen.findByText("This collection is not available any more.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to discover" })).toHaveAttribute("href", "/discovery");
    expect(getCollection).toHaveBeenCalledTimes(1);
  });

  it("sends a visitor without an address to the landing page", () => {
    useDeliveryStore.setState({ address: null, coordinates: null });
    renderAt("/collections/best-burgers");
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(getCollection).not.toHaveBeenCalled();
  });
});
