// A bounded in-memory cache: entries expire after ttlMs, and the oldest entry
// is evicted once maxEntries is reached. Per process, like the rest of the
// in-memory state (see "Single-instance assumptions" in CLAUDE.md).
export function createTtlCache({ ttlMs, maxEntries = 1000 }) {
  const entries = new Map();
  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expiresAt <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      entries.delete(key);
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
