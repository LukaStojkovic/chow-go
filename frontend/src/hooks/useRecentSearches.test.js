import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCurrency } from "./useCurrency";
import { useRecentSearches } from "./useRecentSearches";
import { useAuthStore } from "@/store/useAuthStore";

const KEY = "chowgo:recent-searches";

describe("useRecentSearches", () => {
  it("reads stored searches on first render, dropping junk", () => {
    localStorage.setItem(KEY, JSON.stringify(["pizza", 42, "sushi"]));
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual(["pizza", "sushi"]);
  });

  it("starts empty with unreadable storage", () => {
    localStorage.setItem(KEY, "{not json");
    expect(renderHook(() => useRecentSearches()).result.current.recentSearches).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify({ a: 1 }));
    expect(renderHook(() => useRecentSearches()).result.current.recentSearches).toEqual([]);
  });

  it("adds trimmed terms to the front, de-duplicating case-insensitively", () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addRecentSearch("pizza"));
    act(() => result.current.addRecentSearch("  Sushi "));
    act(() => result.current.addRecentSearch("PIZZA"));
    expect(result.current.recentSearches).toEqual(["PIZZA", "Sushi"]);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(["PIZZA", "Sushi"]);
  });

  it("ignores terms shorter than two characters", () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addRecentSearch(" a "));
    expect(result.current.recentSearches).toEqual([]);
  });

  it("keeps at most six entries", () => {
    const { result } = renderHook(() => useRecentSearches());
    for (const term of ["aa", "bb", "cc", "dd", "ee", "ff", "gg"]) {
      act(() => result.current.addRecentSearch(term));
    }
    expect(result.current.recentSearches).toEqual(["gg", "ff", "ee", "dd", "cc", "bb"]);
  });

  it("removes one entry or clears them all", () => {
    localStorage.setItem(KEY, JSON.stringify(["pizza", "sushi"]));
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.removeRecentSearch("pizza"));
    expect(result.current.recentSearches).toEqual(["sushi"]);
    act(() => result.current.clearRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
    expect(localStorage.getItem(KEY)).toBe("[]");
  });

  it("keeps working in memory when storage refuses writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.addRecentSearch("pizza"));
    act(() => result.current.clearRecentSearches());
    act(() => result.current.addRecentSearch("sushi"));
    expect(result.current.recentSearches).toEqual(["sushi"]);
  });
});

describe("useCurrency", () => {
  it("uses the seller's restaurant currency, else the platform default", () => {
    useAuthStore.setState({ authUser: { role: "seller", restaurant: [{ currency: "eur" }] } });
    expect(renderHook(() => useCurrency()).result.current).toBe("EUR");
    useAuthStore.setState({ authUser: { role: "courier" } });
    expect(renderHook(() => useCurrency()).result.current).toBe("RSD");
    useAuthStore.setState({ authUser: null });
    expect(renderHook(() => useCurrency()).result.current).toBe("RSD");
  });
});
