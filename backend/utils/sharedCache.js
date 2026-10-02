import { getRedis } from "../config/redis.js";
import { createTtlCache } from "./ttlCache.js";
import { logger } from "./logger.js";

export function createSharedCache({ name, ttlMs, maxEntries }) {
  const local = createTtlCache({ ttlMs, maxEntries });
  const prefix = `cache:${name}:`;

  return {
    async get(key) {
      const redis = getRedis();
      if (!redis) return local.get(key);
      try {
        const raw = await redis.get(prefix + key);
        return raw === null ? undefined : JSON.parse(raw);
      } catch (err) {
        logger.warn({ err, cache: name }, "Redis cache read failed");
        return local.get(key);
      }
    },

    async set(key, value) {
      const redis = getRedis();
      if (!redis) return local.set(key, value);
      try {
        await redis.set(prefix + key, JSON.stringify(value), { expiration: { type: "PX", value: ttlMs } });
      } catch (err) {
        logger.warn({ err, cache: name }, "Redis cache write failed");
        local.set(key, value);
      }
    },

    async clear() {
      local.clear();
      const redis = getRedis();
      if (!redis) return;
      for await (const keys of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 500 })) {
        if (keys.length) await redis.del(keys);
      }
    },
  };
}
