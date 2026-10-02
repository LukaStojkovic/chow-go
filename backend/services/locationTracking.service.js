import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";
import { getRedis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const MIN_DB_WRITE_INTERVAL_MS = 3000;
const MIN_BROADCAST_INTERVAL_MS = 1000;

export const lastUpdateTime = new Map();
export const lastBroadcastTime = new Map();

const writeKey = (id) => `loc:write:${id}`;
const broadcastKey = (id) => `loc:broadcast:${id}`;

function takeLocalSlot(map, key, now, intervalMs) {
  if (now - (map.get(key) ?? 0) < intervalMs) return false;
  map.set(key, now);
  return true;
}

async function takeSlot(map, redisKey, key, now, intervalMs) {
  const redis = getRedis();
  if (!redis) return takeLocalSlot(map, key, now, intervalMs);
  try {
    const won = await redis.set(redisKey, "1", { condition: "NX", expiration: { type: "PX", value: intervalMs } });
    return won === "OK";
  } catch (err) {
    logger.warn({ err }, "Location throttle fell back to this instance");
    return takeLocalSlot(map, key, now, intervalMs);
  }
}

export function isUsableCoordinatePair(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  return !(lng === 0 && lat === 0);
}

export async function updateCourierLocation({ courierId, coordinates }) {
  if (!isUsableCoordinatePair(coordinates)) {
    throw new AppError("Invalid coordinates", 400);
  }

  const [lng, lat] = coordinates;
  const key = courierId.toString();
  const now = Date.now();

  if (await takeSlot(lastUpdateTime, writeKey(key), key, now, MIN_DB_WRITE_INTERVAL_MS)) {
    const updated = await Courier.findByIdAndUpdate(
      courierId,
      {
        $set: {
          currentLocation: { type: "Point", coordinates: [lng, lat] },
          lastLocationUpdate: new Date(now),
        },
      },
      { select: "_id" },
    );

    if (!updated) {
      await forgetCourierThrottle(key);
      throw new AppError("Courier not found", 404);
    }
  }

  const shouldBroadcast = await takeSlot(
    lastBroadcastTime,
    broadcastKey(key),
    key,
    now,
    MIN_BROADCAST_INTERVAL_MS,
  );

  return { coordinates: [lng, lat], timestamp: now, shouldBroadcast };
}

export async function forgetCourierThrottle(courierId) {
  const key = courierId.toString();
  lastUpdateTime.delete(key);
  lastBroadcastTime.delete(key);
  try {
    await getRedis()?.del([writeKey(key), broadcastKey(key)]);
  } catch (err) {
    logger.warn({ err }, "Could not clear the location throttle");
  }
}
