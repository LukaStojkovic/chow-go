import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";

const MIN_UPDATE_INTERVAL_MS = 3000;
export const lastUpdateTime = new Map();

export async function updateCourierLocation({ courierId, coordinates }) {
  const [lng, lat] = coordinates ?? [];

  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    throw new AppError("Invalid coordinates", 400);
  }

  const key = courierId.toString();
  const now = Date.now();
  if (now - (lastUpdateTime.get(key) ?? 0) < MIN_UPDATE_INTERVAL_MS) {
    return null;
  }
  lastUpdateTime.set(key, now);

  await Courier.findByIdAndUpdate(courierId, {
    $set: {
      "currentLocation.coordinates": [lng, lat],
      lastLocationUpdate: new Date(),
    },
  });

  return { courierId, coordinates: [lng, lat], timestamp: new Date() };
}
