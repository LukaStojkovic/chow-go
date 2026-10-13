import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";
import { t } from "@chowgo/shared/i18n";

import { api } from "@/api/client";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { axiosError, createTestQueryClient, createWrapper } from "@/test/utils";
import Discover from "../../../app/(customer)/(tabs)/index";
import { CollectionScreen } from "./CollectionScreen";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
}));
jest.mock("@/api/client", () => ({
  __esModule: true,
  api: { get: jest.fn() },
  setUnauthorizedHandler: jest.fn(),
  errorMessage: () => "error",
}));
jest.mock("@/hooks/Favourites/useFavouriteToggle", () => ({
  __esModule: true,
  useFavouriteToggle: () => ({ isFavourite: () => false, toggleFavourite: jest.fn() }),
}));
jest.mock("@/hooks/Orders/useOrders", () => ({
  __esModule: true,
  useCustomerOrders: () => ({ data: undefined }),
}));
jest.mock("@/hooks/Orders/useReorder", () => ({
  __esModule: true,
  useReorder: () => ({ reorder: jest.fn(), conflict: null, confirmReplace: jest.fn(), cancelReplace: jest.fn() }),
}));
jest.mock("@/features/basket/ReplaceBasketPrompt", () => ({
  __esModule: true,
  ReplaceBasketPrompt: () => null,
}));

const restaurant = (id, name) => ({
  _id: id,
  name,
  cuisineType: "italian",
  isActive: true,
  isOpenNow: true,
  currency: "RSD",
  distance: 1200,
});

const dish = (id, name) => ({
  _id: id,
  name,
  price: 900,
  category: "Pizza",
  imageUrls: [],
  restaurant: { _id: "r1", name: "Pizzeria Napoli", currency: "RSD", isOpenNow: true, distance: 1200 },
});

const collections = [
  {
    id: "c1",
    slug: "best-pizza",
    kind: "restaurants",
    title: "Best pizza",
    subtitle: "Wood-fired near you",
    coverImage: null,
    items: [restaurant("r1", "Pizzeria Napoli"), restaurant("r2", "Forno")],
    total: 5,
    hasMore: true,
  },
  {
    id: "c2",
    slug: "cheap-eats",
    kind: "dishes",
    title: "Under 1000 RSD",
    subtitle: null,
    coverImage: null,
    items: [dish("d1", "Margherita")],
    total: 1,
    hasMore: false,
  },
];

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderWithProviders(ui) {
  await render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>, {
    wrapper: createWrapper(createTestQueryClient()),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useDeliveryStore.setState({ coordinates: { lat: 44.8, lon: 20.4 } });
});

describe("Home collection rails", () => {
  beforeEach(() => {
    api.get.mockImplementation(async (url) => {
      if (url === "/discover/collections") return { data: { collections } };
      if (url === "/discover/feed") return { data: { data: [], hasMore: false } };
      if (url === "/discover/promotions") return { data: { deals: [], newRestaurants: [] } };
      return { data: { data: [] } };
    });
  });

  it("renders each rail in server order and opens See all", async () => {
    await renderWithProviders(<Discover />);

    expect(await screen.findByText("Best pizza")).toBeOnTheScreen();
    expect(screen.getByText("Wood-fired near you")).toBeOnTheScreen();
    expect(screen.getByText("Under 1000 RSD")).toBeOnTheScreen();
    expect(
      screen.getAllByText(/^(Best pizza|Under 1000 RSD)$/).map((node) => node.props.children),
    ).toEqual(["Best pizza", "Under 1000 RSD"]);
    expect(screen.getAllByText("Pizzeria Napoli").length).toBeGreaterThan(0);
    expect(screen.getByText("Margherita")).toBeOnTheScreen();
    expect(api.get).toHaveBeenCalledWith("/discover/collections", {
      params: { lat: 44.8, lon: 20.4 },
    });

    expect(
      screen.queryByLabelText(t("discover:collections.seeAllLabel", { title: "Under 1000 RSD" })),
    ).toBeNull();
    await fireEvent.press(
      screen.getByLabelText(t("discover:collections.seeAllLabel", { title: "Best pizza" })),
    );
    expect(router.push).toHaveBeenCalledWith("/(customer)/collection/best-pizza");
  });

  it("hides the rails when the request fails", async () => {
    api.get.mockImplementation(async (url) => {
      if (url === "/discover/collections") throw axiosError(500);
      if (url === "/discover/feed") return { data: { data: [], hasMore: false } };
      if (url === "/discover/promotions") return { data: { deals: [], newRestaurants: [] } };
      return { data: { data: [] } };
    });
    await renderWithProviders(<Discover />);

    await waitFor(() =>
      expect(api.get.mock.calls.some(([url]) => url === "/discover/collections")).toBe(true),
    );
    await waitFor(() => expect(screen.queryByTestId("collections-loading")).toBeNull());
    expect(screen.queryByText("Best pizza")).toBeNull();
  });
});

describe("Collection screen", () => {
  const header = { id: "c1", slug: "best-pizza", kind: "restaurants", title: "Best pizza", subtitle: "Wood-fired", coverImage: null };

  it("pages through the collection", async () => {
    api.get.mockImplementation(async (url, { params }) => {
      if (params.page === 1) {
        return {
          data: {
            collection: header,
            items: [restaurant("r1", "Pizzeria Napoli"), restaurant("r2", "Forno")],
            pagination: { page: 1, limit: 20, total: 3, hasNext: true },
          },
        };
      }
      return {
        data: {
          collection: header,
          items: [restaurant("r3", "Trattoria")],
          pagination: { page: 2, limit: 20, total: 3, hasNext: false },
        },
      };
    });

    await renderWithProviders(<CollectionScreen slug="best-pizza" />);

    expect(await screen.findByText("Pizzeria Napoli")).toBeOnTheScreen();
    expect(screen.getByText(t("discover:collections.countRestaurants", { count: 3 }))).toBeOnTheScreen();
    expect(api.get).toHaveBeenCalledWith("/discover/collections/best-pizza", {
      params: { lat: 44.8, lon: 20.4, page: 1, limit: 20 },
    });

    await fireEvent.press(screen.getByText(t("discover:collections.loadMore")));
    expect(await screen.findByText("Trattoria")).toBeOnTheScreen();
    expect(api.get).toHaveBeenLastCalledWith("/discover/collections/best-pizza", {
      params: { lat: 44.8, lon: 20.4, page: 2, limit: 20 },
    });
    expect(screen.queryByText(t("discover:collections.loadMore"))).toBeNull();

    await fireEvent.press(screen.getByText("Trattoria"));
    expect(router.push).toHaveBeenCalledWith("/(customer)/restaurant/r3");
  });

  it("shows the not-found state with a way back", async () => {
    api.get.mockRejectedValue(axiosError(404, { code: "COLLECTION_NOT_FOUND" }));

    await renderWithProviders(<CollectionScreen slug="gone" />);

    expect(await screen.findByText(t("discover:collections.notFound"))).toBeOnTheScreen();
    expect(api.get).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.press(screen.getByText(t("discover:collections.backHome")));
    });
    expect(router.back).toHaveBeenCalled();
  });
});
