import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export const useDiscoverStore = create((set, get) => ({
  feedItems: [],
  popularItems: [],
  searchRestaurants: [],
  searchItems: [],
  activeCategory: "All",
  page: 1,
  hasMore: true,
  isLoadingFeed: false,
  isLoadingPopular: false,
  isSearching: false,

  setActiveCategory: (category) => {
    set({
      activeCategory: category,
      feedItems: [],
      page: 1,
      hasMore: true,
      isLoadingFeed: false,
    });
  },

  fetchFeed: async (lat, lon) => {
    if (get().isLoadingFeed || !get().hasMore) return;
    set({ isLoadingFeed: true });
    try {
      const { activeCategory, page } = get();
      const res = await axiosInstance.get("/discover/feed", {
        params: { lat, lon, category: activeCategory, page, limit: 12 },
      });
      set((state) => ({
        feedItems:
          page === 1 ? res.data.data : [...state.feedItems, ...res.data.data],
        hasMore: res.data.hasMore,
        isLoadingFeed: false,
      }));
    } catch (error) {
      console.error("Error fetching feed:", error);
      set({ isLoadingFeed: false });
    }
  },

  loadMore: async (lat, lon) => {
    if (!get().hasMore || get().isLoadingFeed) return;
    set((state) => ({ page: state.page + 1 }));
    const { fetchFeed } = get();
    await fetchFeed(lat, lon);
  },

  fetchPopular: async (lat, lon) => {
    set({ isLoadingPopular: true });
    try {
      const res = await axiosInstance.get("/discover/popular", {
        params: { lat, lon },
      });
      set({ popularItems: res.data.data, isLoadingPopular: false });
    } catch (error) {
      console.error("Error fetching popular items:", error);
      set({ isLoadingPopular: false });
    }
  },

  search: async (lat, lon, query) => {
    if (!query) {
      set({ searchRestaurants: [], searchItems: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get("/discover/search", {
        params: { lat, lon, query },
      });
      set({
        searchRestaurants: res.data.restaurants,
        searchItems: res.data.items,
        isSearching: false,
      });
    } catch (error) {
      console.error("Error searching:", error);
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchRestaurants: [], searchItems: [] });
  },
}));
