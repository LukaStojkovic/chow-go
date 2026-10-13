import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import SearchTrend from "../models/SearchTrend.js";
import { AppError } from "../utils/AppError.js";
import { parsePagination } from "../utils/pagination.js";
import { withPromotion } from "../utils/promotion.js";
import { logger } from "../utils/logger.js";
import {
  SEARCH_LIMITS,
  foldText,
  matchRank,
  matchingCategories,
  matchingCuisines,
  normalizeSearchTerm,
  searchPattern,
} from "@chowgo/shared/search";
import { parseSearchFilters, upperBoundMinutes } from "@chowgo/shared/searchFilters";
import { CUISINE_VALUES } from "@chowgo/shared/constants";
import { SUPPORTED_LOCALES, tFor } from "@chowgo/shared/i18n";

const RADIUS_M = 20_000;
const TREND_DAYS = 7;
const TREND_MIN_COUNT = 3;
const TRENDING_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

const CARD_PROJECTION = {
  name: 1, profilePicture: 1, images: 1, cuisineType: 1, description: 1, address: 1, averageRating: 1,
  totalReviews: 1, estimatedDeliveryTime: 1, isOpenNow: 1, isActive: 1, createdAt: 1, currency: 1,
  schedule: 1, timezone: 1, distance: 1,
};
const NAME_SCORE = [0, 60, 80, 100];

function coordinates({ lat, lon }) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new AppError("errors:location.invalid", 400, "LOCATION_INVALID");
  }
  return [longitude, latitude];
}

function nearbyRestaurants([lng, lat], projection = CARD_PROJECTION) {
  return Restaurant.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        key: "location",
        distanceField: "distance",
        maxDistance: RADIUS_M,
        spherical: true,
        query: { isActive: true },
      },
    },
    { $project: projection },
  ]);
}

function areaOf([lng, lat]) {
  return `${lat.toFixed(1)},${lng.toFixed(1)}`;
}

function startOfDay(date = new Date()) {
  return new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);
}

const sameCuisine = (value, slugs) => slugs.includes(String(value ?? "").toLowerCase());

function restaurantScore(restaurant, term, cuisines, dishHits) {
  let score = NAME_SCORE[matchRank(restaurant.name, term)];
  if (sameCuisine(restaurant.cuisineType, cuisines) || matchRank(restaurant.cuisineType, term)) score = Math.max(score, 50);
  if (dishHits) score = Math.max(score, 40) + Math.min(dishHits, 5) * 2;
  if (!score && matchRank(restaurant.description, term)) score = 10;
  return score;
}

function dishScore(item, term, categories) {
  let score = NAME_SCORE[matchRank(item.name, term)];
  if (!score && categories.some((c) => foldText(c) === foldText(item.category))) score = 40;
  if (!score && matchRank(item.category, term)) score = 30;
  if (!score && matchRank(item.description, term)) score = 10;
  return score;
}

const rating = (r) => r.averageRating ?? 0;
const SORTERS = {
  relevance: (a, b) => b.score - a.score || Number(b.isOpenNow) - Number(a.isOpenNow) || rating(b) - rating(a) || a.distance - b.distance,
  rating: (a, b) => rating(b) - rating(a) || (b.totalReviews ?? 0) - (a.totalReviews ?? 0) || b.score - a.score,
  delivery_time: (a, b) =>
    upperBoundMinutes(a.estimatedDeliveryTime) - upperBoundMinutes(b.estimatedDeliveryTime) || b.score - a.score,
  distance: (a, b) => a.distance - b.distance,
};

function passesFilters(restaurant, filters) {
  if (filters.openNow && !restaurant.isOpenNow) return false;
  if (filters.maxDeliveryTime !== "any") {
    const upper = upperBoundMinutes(restaurant.estimatedDeliveryTime);
    if (upper !== Infinity && upper > Number(filters.maxDeliveryTime)) return false;
  }
  return true;
}

function categoryRegexes(categories) {
  return categories.map((c) => new RegExp(`^${searchPattern(c)}$`, "i"));
}

/**
 * Restaurants and dishes near a point matching a term, ranked, filtered and paged on the server.
 * Closed restaurants are included (they take pre-orders) unless `openNow` is set.
 */
export async function searchNearby(query = {}) {
  const point = coordinates(query);
  const term = normalizeSearchTerm(query.q ?? query.query);
  const filters = parseSearchFilters(query);
  const { page, limit, skip } = parsePagination(query, { defaultLimit: SEARCH_LIMITS.pageSize });
  const empty = { restaurants: [], items: [], pagination: { page, limit, total: 0, hasNext: false }, filters };
  if (term.length < SEARCH_LIMITS.minLength) return empty;

  const nearby = await nearbyRestaurants(point);
  if (!nearby.length) return empty;

  const pattern = new RegExp(searchPattern(term), "i");
  const cuisines = matchingCuisines(term);
  const categories = matchingCategories(term);
  const items = await MenuItem.find({
    restaurant: { $in: nearby.map((r) => r._id) },
    available: true,
    $or: [{ name: pattern }, { description: pattern }, { category: pattern }, { category: { $in: categoryRegexes(categories) } }],
  })
    .select("-__v")
    .limit(400)
    .lean();

  const hits = new Map();
  for (const item of items) hits.set(String(item.restaurant), (hits.get(String(item.restaurant)) ?? 0) + 1);

  const allowed = nearby.filter((r) => passesFilters(r, filters));
  const allowedIds = new Set(allowed.map((r) => String(r._id)));
  const matched = allowed
    .map((r) => ({ ...r, score: restaurantScore(r, term, cuisines, hits.get(String(r._id)) ?? 0) }))
    .filter((r) => r.score > 0)
    .sort(SORTERS[filters.sort]);

  const byId = new Map(nearby.map((r) => [String(r._id), r]));
  const now = new Date();
  const dishes =
    page === 1
      ? items
          .filter((item) => allowedIds.has(String(item.restaurant)))
          .map((item) => ({ item, score: dishScore(item, term, categories), restaurant: byId.get(String(item.restaurant)) }))
          .filter((d) => d.score > 0)
          .sort((a, b) =>
            b.score - a.score || Number(b.restaurant.isOpenNow) - Number(a.restaurant.isOpenNow) ||
            (filters.sort === "distance" ? a.restaurant.distance - b.restaurant.distance : rating(b.restaurant) - rating(a.restaurant)),
          )
          .slice(0, SEARCH_LIMITS.dishes)
          .map(({ item, restaurant }) =>
            withPromotion(
              {
                ...item,
                restaurant: {
                  _id: restaurant._id, name: restaurant.name, profilePicture: restaurant.profilePicture,
                  currency: restaurant.currency, isOpenNow: restaurant.isOpenNow, distance: restaurant.distance,
                },
              },
              now,
            ),
          )
      : [];

  const restaurants = matched.slice(skip, skip + limit).map(({ score: _score, ...r }) => r);
  if (page === 1 && (matched.length || dishes.length)) {
    recordSearch(point, term, { restaurants: matched, items, cuisines, categories }).catch((error) =>
      logger.warn({ err: error }, "search trend write failed"),
    );
  }

  return {
    restaurants,
    items: dishes,
    pagination: { page, limit, total: matched.length, hasNext: skip + restaurants.length < matched.length },
    filters,
  };
}

/** Counts a search only when the term is exactly something on the menu nearby. */
async function recordSearch(point, term, { restaurants, items, cuisines, categories }) {
  const key = foldText(term);
  let entry = null;
  const restaurant = restaurants.find((r) => foldText(r.name) === key);
  if (restaurant) entry = { kind: "restaurant", label: restaurant.name };
  const cuisine = !entry && cuisines.find((slug) => labelsOf(slug).some((l) => foldText(l) === key));
  if (cuisine) entry = { kind: "cuisine", label: cuisine };
  const category = !entry && categories.find((value) => categoryLabels(value).some((l) => foldText(l) === key));
  if (category) entry = { kind: "category", label: category };
  const dish = !entry && items.find((item) => foldText(item.name) === key);
  if (dish) entry = { kind: "dish", label: dish.name.trim().slice(0, 80) };
  if (!entry) return;

  await SearchTrend.updateOne(
    { area: areaOf(point), day: startOfDay(), key: `${entry.kind}:${foldText(entry.label)}` },
    { $inc: { count: 1 }, $setOnInsert: entry },
    { upsert: true },
  );
}

function labelsOf(slug) {
  return [slug.replace(/_/g, " "), ...SUPPORTED_LOCALES.map((l) => tFor(l, `common:taxonomy.cuisine.${slug}`, { defaultValue: slug }))];
}

function categoryLabels(value) {
  return [value, ...SUPPORTED_LOCALES.map((l) => tFor(l, `common:taxonomy.category.${value}`, { defaultValue: value }))];
}

/** Typeahead: a few restaurants, cuisines and dish names near a point that match what is typed so far. */
export async function suggest(query = {}) {
  const point = coordinates(query);
  const term = normalizeSearchTerm(query.q ?? query.query);
  if (term.length < SEARCH_LIMITS.minLength) return { suggestions: [] };

  const nearby = await nearbyRestaurants(point, {
    name: 1, profilePicture: 1, cuisineType: 1, isOpenNow: 1, averageRating: 1, distance: 1,
  });
  if (!nearby.length) return { suggestions: [] };

  const restaurants = nearby
    .map((r) => ({ r, rank: matchRank(r.name, term) }))
    .filter((x) => x.rank > 0)
    .sort((a, b) => b.rank - a.rank || Number(b.r.isOpenNow) - Number(a.r.isOpenNow) || rating(b.r) - rating(a.r))
    .slice(0, 4)
    .map(({ r }) => ({
      type: "restaurant", id: String(r._id), label: r.name, image: r.profilePicture ?? null,
      value: r.cuisineType ?? null, isOpen: Boolean(r.isOpenNow),
    }));

  const present = new Set(nearby.map((r) => String(r.cuisineType ?? "").toLowerCase()));
  const cuisines = matchingCuisines(term)
    .filter((slug) => present.has(slug))
    .slice(0, 2)
    .map((slug) => ({ type: "cuisine", value: slug }));

  const pattern = new RegExp(searchPattern(term), "i");
  const names = await MenuItem.find({ restaurant: { $in: nearby.map((r) => r._id) }, available: true, name: pattern })
    .select("name restaurant")
    .limit(200)
    .lean();
  const grouped = new Map();
  for (const item of names) {
    const key = foldText(item.name.trim());
    const entry = grouped.get(key) ?? { label: item.name.trim(), restaurants: new Set() };
    entry.restaurants.add(String(item.restaurant));
    grouped.set(key, entry);
  }
  const dishes = [...grouped.values()]
    .map((d) => ({ ...d, rank: matchRank(d.label, term) }))
    .sort((a, b) => b.rank - a.rank || b.restaurants.size - a.restaurants.size || a.label.localeCompare(b.label))
    .slice(0, SEARCH_LIMITS.suggestions - restaurants.length - cuisines.length)
    .map((d) => ({ type: "dish", label: d.label, count: d.restaurants.size }));

  return { suggestions: [...restaurants, ...cuisines, ...dishes] };
}

/**
 * What people nearby searched for over the last week (only menu names, and only once several
 * searches agree), topped up with the cuisines most common around the point.
 */
export async function trending(query = {}) {
  const point = coordinates(query);
  const [trends, nearby] = await Promise.all([
    SearchTrend.aggregate([
      { $match: { area: areaOf(point), day: { $gte: new Date(startOfDay().getTime() - (TREND_DAYS - 1) * DAY_MS) } } },
      { $group: { _id: "$key", count: { $sum: "$count" }, label: { $first: "$label" }, kind: { $first: "$kind" } } },
      { $match: { count: { $gte: TREND_MIN_COUNT } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TRENDING_LIMIT },
    ]),
    nearbyRestaurants(point, { cuisineType: 1 }),
  ]);

  const counts = new Map();
  for (const r of nearby) {
    const slug = String(r.cuisineType ?? "").toLowerCase();
    if (CUISINE_VALUES.includes(slug)) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const cuisines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([slug]) => slug);

  return {
    trending: trends.map((t) => ({ kind: t.kind, value: t.label, count: t.count })),
    cuisines,
  };
}
