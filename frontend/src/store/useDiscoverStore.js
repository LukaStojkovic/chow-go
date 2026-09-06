import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";

/**
 * Discovery feed, popular items and search.
 *
 * This store bypasses React Query deliberately - it owns cursor-style
 * pagination that appends rather than replaces, which does not map cleanly
 * onto the cache. What it now also owns is failure: each section tracks its
 * own error so one dead request degrades a single section instead of blanking
 * the page.
 *
 * Raw documents are converted to view models on the way in, so components only
 * ever see the shapes in `lib/adapters/types`.
 */
export const useDiscoverStore = create((set, get) => ({
  feedItems: [],
  popularItems: [],
  /** Menu items with a live promotion, deepest discount first. */
  deals: [],
  /** Restaurants that joined within the backend's "new in town" window. */
  newRestaurants: [],
  searchRestaurants: [],
  searchDishes: [],
  activeCategory: "All",
  page: 1,
  hasMore: true,
  isLoadingFeed: false,
  isLoadingPopular: false,
  isLoadingPromotions: false,
  isSearching: false,
  feedError: null,
  popularError: null,
  promotionsError: null,
  searchError: null,

  setActiveCategory: (category) => {
    set({
      activeCategory: category,
      feedItems: [],
      page: 1,
      hasMore: true,
      isLoadingFeed: false,
      feedError: null,
    });
  },

  fetchFeed: async (lat, lon) => {
    if (get().isLoadingFeed) return;
    set({ isLoadingFeed: true, feedError: null });

    try {
      const { activeCategory, page } = get();
      const res = await axiosInstance.get("/discover/feed", {
        params: { lat, lon, category: activeCategory, page, limit: 12 },
      });

      const items = toDishViews(res.data.data);
      set((state) => ({
        // Page 1 replaces; later pages append. Guarding on `page` rather than
        // on the array length keeps a slow first page from being appended to
        // a fresh category.
        feedItems: page === 1 ? items : [...state.feedItems, ...items],
        hasMore: Boolean(res.data.hasMore),
        isLoadingFeed: false,
      }));
    } catch (error) {
      console.error("Error fetching discovery feed:", error);
      set({ isLoadingFeed: false, feedError: "feed" });
    }
  },

  loadMore: async (lat, lon) => {
    if (!get().hasMore || get().isLoadingFeed) return;
    set((state) => ({ page: state.page + 1 }));
    await get().fetchFeed(lat, lon);
  },

  retryFeed: async (lat, lon) => {
    set({ feedError: null });
    await get().fetchFeed(lat, lon);
  },

  fetchPopular: async (lat, lon) => {
    set({ isLoadingPopular: true, popularError: null });
    try {
      const res = await axiosInstance.get("/discover/popular", {
        params: { lat, lon },
      });
      set({ popularItems: toDishViews(res.data.data), isLoadingPopular: false });
    } catch (error) {
      console.error("Error fetching popular items:", error);
      set({ isLoadingPopular: false, popularError: "popular" });
    }
  },

  /**
   * Deals and new arrivals, in one request.
   *
   * Both lists come from the same endpoint because they answer the same
   * question - "what is worth knowing about near this address right now" - and
   * splitting them would mean two geo queries over the same restaurant set.
   */
  fetchPromotions: async (lat, lon) => {
    if (get().isLoadingPromotions) return;
    set({ isLoadingPromotions: true, promotionsError: null });

    try {
      const res = await axiosInstance.get("/discover/promotions", {
        params: { lat, lon },
      });
      set({
        deals: toDishViews(res.data.deals),
        newRestaurants: toRestaurantViews(res.data.newRestaurants),
        isLoadingPromotions: false,
      });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      set({ isLoadingPromotions: false, promotionsError: "promotions" });
    }
  },

  retryPromotions: async (lat, lon) => {
    set({ promotionsError: null });
    await get().fetchPromotions(lat, lon);
  },

  search: async (lat, lon, query) => {
    if (!query) {
      set({ searchRestaurants: [], searchDishes: [], searchError: null });
      return;
    }

    set({ isSearching: true, searchError: null });
    try {
      const res = await axiosInstance.get("/discover/search", {
        params: { lat, lon, query },
      });
      set({
        searchRestaurants: toRestaurantViews(res.data.restaurants),
        searchDishes: toDishViews(res.data.items),
        isSearching: false,
      });
    } catch (error) {
      console.error("Error searching:", error);
      set({ isSearching: false, searchError: "search" });
    }
  },

  clearSearch: () => {
    set({ searchRestaurants: [], searchDishes: [], searchError: null });
  },
}));
