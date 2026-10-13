import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { t } from "@chowgo/shared/i18n";
import { cuisineLabel } from "@chowgo/shared/constants";
import { getSearchSuggestions, getTrendingSearches, searchDiscover } from "@/services/apiSearch";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { renderWithProviders } from "@/test/utils";
import SearchPage from "./SearchPage";

vi.mock("@/services/apiSearch", () => ({
  searchDiscover: vi.fn(),
  getSearchSuggestions: vi.fn(),
  getTrendingSearches: vi.fn(),
}));
vi.mock("@/hooks/Favourites/useFavourites", () => ({
  useFavourites: () => ({ isFavourite: () => false, toggleFavourite: vi.fn(), isPending: false }),
}));
vi.mock("@/components/basket/ItemCustomizationSheet", () => ({
  ItemCustomizationSheet: () => null,
}));

const COORDS = { lat: 44.8, lon: 20.4 };

const restaurant = (id, name, extra = {}) => ({
  _id: id,
  name,
  cuisineType: "italian",
  isActive: true,
  isOpenNow: true,
  currency: "RSD",
  ...extra,
});

function page({ restaurants = [], items = [], page: n = 1, total, hasNext = false } = {}) {
  return {
    restaurants,
    items,
    pagination: { page: n, limit: 10, total: total ?? restaurants.length, hasNext },
    filters: {},
  };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderAt(route) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/restaurant/:id" element={<p>restaurant page</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route },
  );
}

const lastSearchParams = () => searchDiscover.mock.calls.at(-1)[0];

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  useDeliveryStore.setState({ address: "Knez Mihailova 1", coordinates: COORDS });
  searchDiscover.mockResolvedValue(page());
  getSearchSuggestions.mockResolvedValue({ suggestions: [] });
  getTrendingSearches.mockResolvedValue({ trending: [], cuisines: [] });
});

describe("SearchPage results", () => {
  it("reads filters from the URL, sends them to the server and pages restaurants", async () => {
    searchDiscover
      .mockResolvedValueOnce(
        page({ restaurants: [restaurant("r1", "Pizza Uno")], total: 2, hasNext: true }),
      )
      .mockResolvedValueOnce(
        page({ restaurants: [restaurant("r2", "Pizza Due", { isOpenNow: false })], page: 2, total: 2 }),
      );

    renderAt("/search?q=pizza&openNow=true&maxDeliveryTime=30&sort=rating");

    expect(await screen.findByText("Pizza Uno")).toBeInTheDocument();
    expect(searchDiscover).toHaveBeenCalledWith({
      ...COORDS,
      q: "pizza",
      openNow: "true",
      maxDeliveryTime: "30",
      sort: "rating",
      page: 1,
      limit: 10,
    });
    expect(screen.getByRole("button", { name: t("discover:filters.openNow") })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: t("discover:search.showMoreRestaurants") }));

    expect(await screen.findByText("Pizza Due")).toBeInTheDocument();
    expect(lastSearchParams()).toMatchObject({ q: "pizza", page: 2, openNow: "true" });
    expect(screen.getByText("Pizza Uno")).toBeInTheDocument();
    expect(screen.getByText(t("restaurant:availability.preorderShort"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("discover:search.showMoreRestaurants") })).toBeNull();
  });

  it("writes a toggled filter into the URL and refetches with it", async () => {
    searchDiscover.mockResolvedValue(page({ restaurants: [restaurant("r1", "Pizza Uno")] }));
    renderAt("/search?q=pizza");

    await screen.findByText("Pizza Uno");
    await userEvent.click(screen.getByRole("button", { name: t("discover:filters.openNow") }));

    await waitFor(() => expect(lastSearchParams()).toMatchObject({ q: "pizza", openNow: "true" }));
    expect(screen.getByTestId("location")).toHaveTextContent("openNow=true");
    expect(screen.getByTestId("location")).toHaveTextContent("q=pizza");
  });

  it("explains that the filters hid everything", async () => {
    renderAt("/search?q=pizza&openNow=true");

    expect(await screen.findByText(t("discover:search.noFilterMatches.title"))).toBeInTheDocument();
  });
});

describe("SearchPage typeahead", () => {
  const suggestions = [
    { type: "restaurant", id: "r9", label: "Pizzeria Napoli", image: null, value: "italian", isOpen: false },
    { type: "cuisine", value: "italian" },
    { type: "dish", label: "Pizza Capricciosa", count: 3 },
  ];

  it("lists suggestions with highlighting and opens a restaurant from the keyboard", async () => {
    getSearchSuggestions.mockResolvedValue({ suggestions });
    renderAt("/search");

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "piz");

    const listbox = await screen.findByRole("listbox");
    await waitFor(() => expect(within(listbox).getAllByRole("option")).toHaveLength(4));
    const options = within(listbox).getAllByRole("option");
    expect(options[0]).toHaveTextContent(t("discover:search.searchFor", { query: "piz" }));
    expect(within(options[1]).getByText("Piz", { selector: "mark" })).toBeInTheDocument();
    expect(options[1]).toHaveTextContent(t("discover:search.closedNow"));
    expect(options[3]).toHaveTextContent(t("discover:search.suggestionDish", { count: 3 }));
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(getSearchSuggestions).toHaveBeenLastCalledWith({ ...COORDS, q: "piz" });

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Enter}");
    expect(await screen.findByText("restaurant page")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/restaurant/r9");
  });

  it("runs a search for a dish or cuisine suggestion and closes on Escape", async () => {
    getSearchSuggestions.mockResolvedValue({ suggestions });
    renderAt("/search");

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "piz");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input).toHaveValue("piz");

    await userEvent.keyboard("{ArrowDown}{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[3].id);
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(lastSearchParams()).toMatchObject({ q: "Pizza Capricciosa" }));
    expect(input).toHaveValue("Pizza Capricciosa");
    expect(screen.queryByRole("listbox")).toBeNull();

    await userEvent.clear(input);
    await userEvent.type(input, "piz");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));
    const cuisine = screen.getAllByRole("option")[2];
    await userEvent.click(cuisine);
    const label = cuisineLabel(t, "italian");
    await waitFor(() => expect(lastSearchParams()).toMatchObject({ q: label }));
  });
});

describe("SearchPage empty query", () => {
  it("shows trending and popular cuisine chips that run a search", async () => {
    getTrendingSearches.mockResolvedValue({
      trending: [
        { kind: "dish", value: "Ćevapi", count: 5 },
        { kind: "category", value: "Pizza", count: 3 },
      ],
      cuisines: ["italian"],
    });
    renderAt("/search");

    expect(await screen.findByText(t("discover:search.trending"))).toBeInTheDocument();
    expect(screen.getByText(t("discover:search.popularCuisines"))).toBeInTheDocument();
    expect(getTrendingSearches).toHaveBeenCalledWith(COORDS);

    await userEvent.click(screen.getByRole("button", { name: "Ćevapi" }));
    await waitFor(() => expect(lastSearchParams()).toMatchObject({ q: "Ćevapi" }));
    expect(screen.getByTestId("location")).toHaveTextContent("q=");
  });

  it("hides sections with nothing in them", async () => {
    renderAt("/search");

    expect(await screen.findByText(t("discover:search.prompt.title"))).toBeInTheDocument();
    expect(screen.queryByText(t("discover:search.trending"))).toBeNull();
    expect(screen.queryByText(t("discover:search.popularCuisines"))).toBeNull();
  });
});
