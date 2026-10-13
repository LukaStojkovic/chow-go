import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";
import { cuisineLabel } from "@chowgo/shared/constants";
import { t } from "@chowgo/shared/i18n";

import { api } from "@/api/client";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import Search from "../../../app/(customer)/(tabs)/search";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("@/api/client", () => ({ __esModule: true, api: { get: jest.fn() } }));
jest.mock("@/hooks/Favourites/useFavouriteToggle", () => ({
  __esModule: true,
  useFavouriteToggle: () => ({ isFavourite: () => false, toggleFavourite: jest.fn() }),
}));

const restaurant = {
  _id: "r1",
  name: "Pizzeria Napoli",
  cuisineType: "italian",
  isActive: true,
  isOpenNow: false,
  currency: "RSD",
  distance: 1200,
};

const responses = {
  "/discover/search": () => ({
    restaurants: [restaurant],
    items: [],
    pagination: { page: 1, limit: 10, total: 1, hasNext: false },
  }),
  "/discover/search/suggest": () => ({
    suggestions: [
      { type: "restaurant", id: "r1", label: "Pizzeria Napoli", value: "italian", isOpen: false },
      { type: "dish", label: "Pizza Margherita", count: 3 },
    ],
  }),
  "/discover/search/trending": () => ({
    trending: [{ kind: "dish", value: "Ćevapi", count: 5 }],
    cuisines: ["italian"],
  }),
};

function searchCalls() {
  return api.get.mock.calls.filter(([url]) => url === "/discover/search").map(([, config]) => config.params);
}

async function renderSearch() {
  const metrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Search />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
  return screen.getByLabelText(t("discover:search.label"));
}

beforeEach(() => {
  jest.clearAllMocks();
  useDeliveryStore.setState({ coordinates: { lat: 44.8, lon: 20.4 } });
  api.get.mockImplementation(async (url) => ({ data: responses[url]() }));
});

describe("Search screen", () => {
  it("sends the query and filters to the server", async () => {
    const input = await renderSearch();
    await fireEvent.changeText(input, "pizza");
    await fireEvent(input, "submitEditing");

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    expect(searchCalls()[0]).toMatchObject({ lat: 44.8, lon: 20.4, q: "pizza", page: 1 });
    expect(await screen.findByLabelText("Pizzeria Napoli")).toBeOnTheScreen();
    expect(screen.getByText(t("restaurant:availability.closedNow"))).toBeOnTheScreen();

    await fireEvent.press(screen.getByText(t("discover:filters.openNow")));
    await waitFor(() => expect(searchCalls()).toHaveLength(2));
    expect(searchCalls()[1]).toMatchObject({ q: "pizza", openNow: "true", page: 1 });
  });

  it("shows suggestions while typing and opens a restaurant", async () => {
    const input = await renderSearch();
    await fireEvent(input, "focus");
    await fireEvent.changeText(input, "pizz");

    const row = await screen.findByLabelText(
      `Pizzeria Napoli, ${t("discover:search.suggestionRestaurant")} · ${cuisineLabel(t, "italian")} · ${t("discover:search.closedNow")}`,
    );
    expect(screen.getByLabelText(t("discover:search.searchFor", { query: "pizz" }))).toBeOnTheScreen();
    expect(api.get).toHaveBeenCalledWith("/discover/search/suggest", {
      params: { lat: 44.8, lon: 20.4, q: "pizz" },
    });

    await fireEvent.press(row);
    expect(router.push).toHaveBeenCalledWith("/(customer)/restaurant/r1");
    expect(searchCalls()).toHaveLength(0);
  });

  it("runs the search for a tapped dish suggestion", async () => {
    const input = await renderSearch();
    await fireEvent(input, "focus");
    await fireEvent.changeText(input, "pizz");

    const dish = t("discover:search.suggestionDish", { count: 3 });
    await fireEvent.press(await screen.findByLabelText(`Pizza Margherita, ${dish}`));

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    expect(searchCalls()[0]).toMatchObject({ q: "Pizza Margherita" });
    expect(screen.queryByLabelText(`Pizza Margherita, ${dish}`)).toBeNull();
  });

  it("runs a search from a trending chip", async () => {
    await renderSearch();

    expect(await screen.findByText(t("discover:search.trending"))).toBeOnTheScreen();
    expect(screen.getByText(t("discover:search.popularCuisines"))).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Ćevapi"));

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    expect(searchCalls()[0]).toMatchObject({ q: "Ćevapi" });
  });
});
