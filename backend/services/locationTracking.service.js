import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";

const MIN_DB_WRITE_INTERVAL_MS = 3000;
const MIN_BROADCAST_INTERVAL_MS = 1000;

export const lastUpdateTime = new Map();
export const lastBroadcastTime = new Map();

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

  if (now - (lastUpdateTime.get(key) ?? 0) >= MIN_DB_WRITE_INTERVAL_MS) {
    lastUpdateTime.set(key, now);

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
      lastUpdateTime.delete(key);
      throw new AppError("Courier not found", 404);
    }
  }

  const shouldBroadcast =
    now - (lastBroadcastTime.get(key) ?? 0) >= MIN_BROADCAST_INTERVAL_MS;
  if (shouldBroadcast) lastBroadcastTime.set(key, now);

  return { coordinates: [lng, lat], timestamp: now, shouldBroadcast };
}

export function forgetCourierThrottle(courierId) {
  const key = courierId.toString();
  lastUpdateTime.delete(key);
  lastBroadcastTime.delete(key);
}
