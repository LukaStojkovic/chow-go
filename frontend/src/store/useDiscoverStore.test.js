import { beforeEach, describe, expect, it, vi } from "vitest";

import { axiosInstance } from "@/lib/axios";
import { useDiscoverStore } from "./useDiscoverStore";

const initial = useDiscoverStore.getState();
const dishes = (...ids) => ids.map((id) => ({ _id: id, name: `Dish ${id}`, price: 5 }));
const restaurants = (...ids) => ids.map((id) => ({ _id: id, name: `R ${id}` }));

let get;

beforeEach(() => {
  useDiscoverStore.setState(initial, true);
  get = vi.spyOn(axiosInstance, "get");
});

describe("feed", () => {
  it("replaces on page 1 and appends on later pages", async () => {
    get.mockResolvedValueOnce({ data: { data: dishes("a", "b"), hasMore: true } });
    await useDiscoverStore.getState().fetchFeed(44.8, 20.4);
    expect(get).toHaveBeenCalledWith("/discover/feed", {
      params: { lat: 44.8, lon: 20.4, category: "All", page: 1, limit: 12 },
    });
    expect(useDiscoverStore.getState().feedItems.map((d) => d.id)).toEqual(["a", "b"]);

    get.mockResolvedValueOnce({ data: { data: dishes("c"), hasMore: false } });
    await useDiscoverStore.getState().loadMore(44.8, 20.4);
    expect(useDiscoverStore.getState()).toMatchObject({ page: 2, hasMore: false });
    expect(useDiscoverStore.getState().feedItems.map((d) => d.id)).toEqual(["a", "b", "c"]);

    await useDiscoverStore.getState().loadMore(44.8, 20.4);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("ignores a second fetch while one is in flight", async () => {
    useDiscoverStore.setState({ isLoadingFeed: true });
    await useDiscoverStore.getState().fetchFeed(1, 1);
    await useDiscoverStore.getState().loadMore(1, 1);
    expect(get).not.toHaveBeenCalled();
  });

  it("resets pagination when the category changes", () => {
    useDiscoverStore.setState({ feedItems: [{ id: "x" }], page: 4, hasMore: false, feedError: "feed" });
    useDiscoverStore.getState().setActiveCategory("Pizza");
    expect(useDiscoverStore.getState()).toMatchObject({
      activeCategory: "Pizza",
      feedItems: [],
      page: 1,
      hasMore: true,
      feedError: null,
    });
  });

  it("records a feed error and retries it", async () => {
    get.mockRejectedValueOnce(new Error("offline"));
    await useDiscoverStore.getState().fetchFeed(1, 1);
    expect(useDiscoverStore.getState()).toMatchObject({ feedError: "feed", isLoadingFeed: false });

    get.mockResolvedValueOnce({ data: { data: dishes("a") } });
    await useDiscoverStore.getState().retryFeed(1, 1);
    expect(useDiscoverStore.getState()).toMatchObject({ feedError: null, hasMore: false });
  });
});

describe("popular and promotions", () => {
  it("loads popular dishes and keeps the section's own error", async () => {
    get.mockResolvedValueOnce({ data: { data: dishes("p") } });
    await useDiscoverStore.getState().fetchPopular(1, 1);
    expect(useDiscoverStore.getState().popularItems).toHaveLength(1);

    get.mockRejectedValueOnce(new Error("offline"));
    await useDiscoverStore.getState().fetchPopular(1, 1);
    expect(useDiscoverStore.getState()).toMatchObject({ popularError: "popular", isLoadingPopular: false });
  });

  it("loads deals and new restaurants as view models", async () => {
    get.mockResolvedValueOnce({ data: { deals: dishes("d"), newRestaurants: restaurants("r") } });
    await useDiscoverStore.getState().fetchPromotions(1, 1);
    expect(useDiscoverStore.getState().deals[0]).toMatchObject({ id: "d" });
    expect(useDiscoverStore.getState().newRestaurants[0]).toMatchObject({ id: "r", name: "R r" });
  });

  it("skips while loading and retries after an error", async () => {
    useDiscoverStore.setState({ isLoadingPromotions: true });
    await useDiscoverStore.getState().fetchPromotions(1, 1);
    expect(get).not.toHaveBeenCalled();

    useDiscoverStore.setState({ isLoadingPromotions: false });
    get.mockRejectedValueOnce(new Error("offline"));
    await useDiscoverStore.getState().fetchPromotions(1, 1);
    expect(useDiscoverStore.getState().promotionsError).toBe("promotions");

    get.mockResolvedValueOnce({ data: {} });
    await useDiscoverStore.getState().retryPromotions(1, 1);
    expect(useDiscoverStore.getState()).toMatchObject({ promotionsError: null, deals: [], newRestaurants: [] });
  });
});

describe("search", () => {
  it("clears results for an empty query without a request", async () => {
    useDiscoverStore.setState({ searchDishes: [{ id: "x" }], searchError: "search" });
    await useDiscoverStore.getState().search(1, 1, "");
    expect(get).not.toHaveBeenCalled();
    expect(useDiscoverStore.getState()).toMatchObject({ searchDishes: [], searchError: null });
  });

  it("maps restaurants and dishes, and records failures", async () => {
    get.mockResolvedValueOnce({ data: { restaurants: restaurants("r"), items: dishes("d", "e") } });
    await useDiscoverStore.getState().search(1, 2, "piz");
    expect(get).toHaveBeenCalledWith("/discover/search", { params: { lat: 1, lon: 2, query: "piz" } });
    expect(useDiscoverStore.getState().searchRestaurants).toHaveLength(1);
    expect(useDiscoverStore.getState().searchDishes).toHaveLength(2);

    get.mockRejectedValueOnce(new Error("offline"));
    await useDiscoverStore.getState().search(1, 2, "piz");
    expect(useDiscoverStore.getState()).toMatchObject({ isSearching: false, searchError: "search" });

    useDiscoverStore.getState().clearSearch();
    expect(useDiscoverStore.getState()).toMatchObject({ searchRestaurants: [], searchDishes: [], searchError: null });
  });
});
