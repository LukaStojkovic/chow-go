import dotenv from "dotenv";
import { AppError } from "../utils/AppError.js";
import Restaurant from "../models/Restaurant.js";

dotenv.config();

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError(
      `External API error: ${response.status} ${response.statusText}`,
      502
    );
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

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lonNum}&format=json&addressdetails=1&user-agent=ChowGo/1.0`;

  const data = await fetchJson(url);

  res.status(200).json(data);
}

export async function locationPrediction(req, res, next) {
  const { query } = req.query;

  let searchQuery = query?.trim();

  if (!searchQuery) {
    return next(new AppError("Search query is required", 400));
  }

  const accessKey = process.env.LOCATION_IQ_ACCESS_KEY;
  if (!accessKey) {
    return next(new AppError("Location service not configured", 500));
  }

  const url = `https://api.locationiq.com/v1/autocomplete?key=${accessKey}&q=${encodeURIComponent(
    searchQuery
  )}&limit=5&dedupe=1`;

  const data = await fetchJson(url);

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
          openingTime: 1,
          closingTime: 1,
          isOpenNow: 1,
          averageRating: 1,
          totalReviews: 1,
          estimatedDeliveryTime: 1,
          cuisineType: 1,
          profilePicture: 1,
          phone: 1,
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
