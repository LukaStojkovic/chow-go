import { useCallback, useState } from "react";

const STORAGE_KEY = "chowgo:recent-searches";
const MAX_ENTRIES = 6;

/**
 * Recently used search terms, kept on the device.
 *
 * Deliberately local rather than server-side: search history is personal, it
 * is only useful on the device it was typed on, and there is no endpoint for
 * it. Every read and write is guarded because `localStorage` throws outright
 * in private mode on some browsers and when site data is blocked.
 *
 * @returns {{
 *   recentSearches: string[],
 *   addRecentSearch: (term: string) => void,
 *   removeRecentSearch: (term: string) => void,
 *   clearRecentSearches: () => void,
 * }}
 */
export function useRecentSearches() {
  // Read once during the initial render rather than in an effect, so the list
  // is present on first paint instead of flashing empty.
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      // Unreadable or blocked storage just means no history this session.
      return [];
    }
  });

  const persist = useCallback((next) => {
    setRecentSearches(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Nothing to recover: the in-memory list still works for this session.
    }
  }, []);

  const addRecentSearch = useCallback(
    (term) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) return;

      setRecentSearches((current) => {
        const next = [
          trimmed,
          ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, MAX_ENTRIES);

        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignored - see above */
        }
        return next;
      });
    },
    [],
  );

  const removeRecentSearch = useCallback(
    (term) => persist(recentSearches.filter((item) => item !== term)),
    [persist, recentSearches],
  );

  const clearRecentSearches = useCallback(() => persist([]), [persist]);

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}
