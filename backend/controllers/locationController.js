import "../config/env.js";
import { AppError } from "../utils/AppError.js";
import Restaurant from "../models/Restaurant.js";
import { createSharedCache } from "../utils/sharedCache.js";
import { getRedis } from "../config/redis.js";
import { logger } from "../utils/logger.js";


const UPSTREAM_TIMEOUT_MS = 5_000;
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 100;
// Nominatim's usage policy allows one request per second per application; a
// single scraper hitting this public proxy would get the server's IP banned
// and break reverse geocoding for everyone.
const NOMINATIM_SPACING_MS = 1_000;
const NOMINATIM_MAX_WAIT_MS = 5_000;

const reverseCache = createSharedCache({ name: "reverse-geocode", ttlMs: 24 * 60 * 60 * 1000, maxEntries: 2000 });
const autocompleteCache = createSharedCache({ name: "autocomplete", ttlMs: 60 * 60 * 1000, maxEntries: 2000 });
const NOMINATIM_SLOT_KEY = "nominatim:next-slot";
let nextNominatimSlot = 0;

const RESERVE_SLOT = `
local now = tonumber(ARGV[1])
local slot = math.max(now, tonumber(redis.call("GET", KEYS[1]) or "0"))
if slot - now > tonumber(ARGV[3]) then return -1 end
redis.call("SET", KEYS[1], slot + tonumber(ARGV[2]), "PX", tonumber(ARGV[3]) + tonumber(ARGV[2]))
return slot
`;

export async function resetLocationCaches() {
  await Promise.all([reverseCache.clear(), autocompleteCache.clear()]);
  nextNominatimSlot = 0;
  await getRedis()?.del(NOMINATIM_SLOT_KEY);
}

function reserveLocalSlot(now) {
  const slot = Math.max(now, nextNominatimSlot);
  if (slot - now > NOMINATIM_MAX_WAIT_MS) return -1;
  nextNominatimSlot = slot + NOMINATIM_SPACING_MS;
  return slot;
}

async function reserveSlot(now) {
  const redis = getRedis();
  if (!redis) return reserveLocalSlot(now);
  try {
    return Number(
      await redis.eval(RESERVE_SLOT, {
        keys: [NOMINATIM_SLOT_KEY],
        arguments: [String(now), String(NOMINATIM_SPACING_MS), String(NOMINATIM_MAX_WAIT_MS)],
      }),
    );
  } catch (err) {
    logger.warn({ err }, "Nominatim slot reservation fell back to this instance");
    return reserveLocalSlot(now);
  }
}

async function waitForNominatimSlot() {
  const now = Date.now();
  const slot = await reserveSlot(now);
  if (slot < 0) {
    throw new AppError("Location lookup is busy. Please try again in a moment.", 503, "LOCATION_BUSY");
  }
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "ChowGo/1.0 (food delivery; contact via chowgo support)" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new AppError("Location service is unavailable", 502, "LOCATION_UPSTREAM");
  }

  if (!response.ok) {
    throw new AppError(`External API error: ${response.status}`, 502, "LOCATION_UPSTREAM");
  }

  return await response.json();
}

export async function getLocation(req, res, next) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return next(new AppError("Latitude and longitude are required", 400));
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (
    isNaN(latNum) ||
    isNaN(lonNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lonNum < -180 ||
    lonNum > 180
  ) {
    return next(new AppError("Invalid latitude or longitude values", 400));
  }

  // ~11 m: enough for a street address, coarser than the device reports, and
  // it lets nearby lookups share a cache entry.
  const roundedLat = latNum.toFixed(4);
  const roundedLon = lonNum.toFixed(4);
  const cacheKey = `${roundedLat},${roundedLon}`;

  let data = await reverseCache.get(cacheKey);
  if (!data) {
    await waitForNominatimSlot();
    data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLon}&format=json&addressdetails=1`,
    );
    await reverseCache.set(cacheKey, data);
  }

  res.status(200).json(data);
}

export async function locationPrediction(req, res, next) {
  const { query } = req.query;

  if (typeof query !== "string" || !query.trim()) {
    return next(new AppError("Search query is required", 400));
  }

  const searchQuery = query.trim().replace(/\s+/g, " ");
  if (searchQuery.length < MIN_QUERY_LENGTH || searchQuery.length > MAX_QUERY_LENGTH) {
    return next(
      new AppError(
        `Search query must be ${MIN_QUERY_LENGTH}-${MAX_QUERY_LENGTH} characters`,
        400,
        "QUERY_LENGTH",
      ),
    );
  }

  const accessKey = process.env.LOCATION_IQ_ACCESS_KEY;
  if (!accessKey) {
    return next(new AppError("Location service not configured", 500));
  }

  const cacheKey = searchQuery.toLowerCase();
  let data = await autocompleteCache.get(cacheKey);
  if (!data) {
    data = await fetchJson(
      `https://api.locationiq.com/v1/autocomplete?key=${accessKey}&q=${encodeURIComponent(
        searchQuery,
      )}&limit=5&dedupe=1`,
    );
    await autocompleteCache.set(cacheKey, data);
  }

  res.status(200).json({ status: "success", data });
}

export async function getNearRestaurants(req, res, next) {
  const { lat, lon, maxDistanceMeters = 20_000 } = req.query;

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  const maxDistanceNum = Number(maxDistanceMeters);

  if (
    isNaN(maxDistanceNum) ||
    maxDistanceNum <= 0 ||
    maxDistanceNum > 100_000
  ) {
    return next(new AppError("Max distance out of range", 400));
  }

  if (
    isNaN(latNum) ||
    isNaN(lonNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lonNum < -180 ||
    lonNum > 180
  ) {
    return next(new AppError("Invalid Location", 400));
  }

  try {
    const nearbyRestaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lonNum, latNum],
          },
          key: "location",
          distanceField: "distance",
          maxDistance: maxDistanceNum,
          spherical: true,
        },
      },
      {
        $match: {
          isActive: true,
          isOpenNow: true,
        },
      },
      {
        $sort: { distance: 1 },
      },
      {
        $limit: 50,
      },
      {
        $project: {
          name: 1,
          schedule: 1,
          isOpenNow: 1,
          averageRating: 1,
          totalReviews: 1,
          estimatedDeliveryTime: 1,
          cuisineType: 1,
          profilePicture: 1,
          phone: 1,
          images: 1,
          address: 1,
          distance: 1,
          _id: 1,
        },
      },
    ]);

    if (!nearbyRestaurants.length) {
      return next(new AppError("No restaurants found nearby", 404));
    }

    res.status(200).json({ status: "success", data: nearbyRestaurants });
  } catch (err) {
    return next(new AppError("Failed getting nearby restaurants", 500));
  }
}
