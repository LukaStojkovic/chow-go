import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "chowgo:recent-searches";
const MAX = 6;

export function useRecentSearches() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setRecent(raw ? JSON.parse(raw) : []))
      .catch(() => setRecent([]));
  }, []);

  const persist = useCallback((next) => {
    setRecent(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const remember = useCallback((term) => {
    const value = term?.trim();
    if (!value) return;
    setRecent((current) => {
      const next = [value, ...current.filter((entry) => entry !== value)].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { recent, remember, clear: () => persist([]) };
}
