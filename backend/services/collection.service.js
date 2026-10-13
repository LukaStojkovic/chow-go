import mongoose from "mongoose";
import Collection from "../models/Collection.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import { AppError } from "../utils/AppError.js";
import { parsePagination } from "../utils/pagination.js";
import { containsRegex } from "../utils/regex.js";
import { createSharedCache } from "../utils/sharedCache.js";
import { discountPercent, effectivePrice, isPromotionLive, withPromotion } from "../utils/promotion.js";
import {
  COLLECTION_LIMITS,
  isCollectionLive,
  localizedText,
  normalizeCollectionInput,
} from "@chowgo/shared/collections";
import { DEFAULT_CURRENCY } from "@chowgo/shared/currency";

const RADIUS_M = 20_000;
const POPULAR_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const homeCache = createSharedCache({ name: "collections", ttlMs: 60 * 1000, maxEntries: 500 });
const popularCache = createSharedCache({ name: "collection-popular", ttlMs: 10 * 60 * 1000, maxEntries: 500 });

const CARD_PROJECTION = {
  name: 1, profilePicture: 1, images: 1, cuisineType: 1, description: 1, address: 1, averageRating: 1,
  totalReviews: 1, estimatedDeliveryTime: 1, isOpenNow: 1, isActive: 1, createdAt: 1, currency: 1,
  schedule: 1, timezone: 1, distance: 1,
};

const collectionError = (code, status = 400, params = {}) =>
  new AppError(`errors:collection.${code.replace(/^COLLECTION_/, "").toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())}`, status, code, params, params.field ? { field: params.field } : undefined);

function pointOf({ lat, lon }) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new AppError("errors:location.invalid", 400, "LOCATION_INVALID");
  }
  return [longitude, latitude];
}

function nearby([lng, lat]) {
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
    { $project: CARD_PROJECTION },
  ]);
}

const rating = (r) => r?.averageRating ?? 0;
const areaKey = ([lng, lat], digits = 2) => `${lat.toFixed(digits)},${lng.toFixed(digits)}`;

async function popularity(point, restaurantIds, field) {
  const key = `${field}:${areaKey(point)}`;
  const cached = await popularCache.get(key);
  if (cached) return new Map(cached);
  const counts = await Order.aggregate([
    { $match: { restaurant: { $in: restaurantIds }, status: "delivered", createdAt: { $gte: new Date(Date.now() - POPULAR_WINDOW_MS) } } },
    ...(field === "items" ? [{ $unwind: "$items" }, { $group: { _id: "$items.menuItem", n: { $sum: "$items.quantity" } } }] : [{ $group: { _id: "$restaurant", n: { $sum: 1 } } }]),
  ]);
  const entries = counts.map(({ _id, n }) => [String(_id), n]);
  await popularCache.set(key, entries);
  return new Map(entries);
}

function restaurantPasses(r, rules, now) {
  if (rules.cuisines?.length && !rules.cuisines.includes(String(r.cuisineType ?? "").toLowerCase())) return false;
  if (rules.minRating && rating(r) < rules.minRating) return false;
  if (rules.openNow && !r.isOpenNow) return false;
  if (rules.newWithinDays && !(new Date(r.createdAt) >= new Date(now.getTime() - rules.newWithinDays * DAY_MS))) return false;
  return true;
}

const categoryFilter = (categories) =>
  categories?.length ? { category: { $in: categories.map((c) => new RegExp(`^${c}$`, "i")) } } : {};

const liveDealFilter = (now) => ({
  "promotion.isActive": true,
  $and: [
    { $or: [{ "promotion.startsAt": null }, { "promotion.startsAt": { $lte: now } }] },
    { $or: [{ "promotion.endsAt": null }, { "promotion.endsAt": { $gt: now } }] },
  ],
});

const pinOrder = (pins, docs) => {
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return pins.map((id) => byId.get(String(id))).filter(Boolean);
};

async function resolveRestaurants(collection, point, places, now) {
  const rules = collection.rules ?? {};
  const pins = pinOrder(collection.pins ?? [], places);
  if (collection.manualOnly) return pins;

  let candidates = places.filter((r) => restaurantPasses(r, rules, now));
  if (rules.categories?.length || rules.onlyDeals) {
    const serving = await MenuItem.distinct("restaurant", {
      restaurant: { $in: candidates.map((r) => r._id) },
      available: true,
      ...categoryFilter(rules.categories),
      ...(rules.onlyDeals ? liveDealFilter(now) : {}),
    });
    const set = new Set(serving.map(String));
    candidates = candidates.filter((r) => set.has(String(r._id)));
  }

  const popular = rules.sort === "popular" ? await popularity(point, places.map((r) => r._id), "restaurants") : null;
  const sorters = {
    rating: (a, b) => rating(b) - rating(a) || (b.totalReviews ?? 0) - (a.totalReviews ?? 0) || a.distance - b.distance,
    distance: (a, b) => a.distance - b.distance,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => (popular.get(String(b._id)) ?? 0) - (popular.get(String(a._id)) ?? 0) || rating(b) - rating(a),
  };
  const pinned = new Set(pins.map((r) => String(r._id)));
  const rest = candidates.filter((r) => !pinned.has(String(r._id))).sort(sorters[rules.sort] ?? sorters.rating);
  return [...pins, ...rest];
}

function withRestaurant(item, restaurant, now) {
  return withPromotion(
    {
      ...item,
      restaurant: {
        _id: restaurant._id, name: restaurant.name, profilePicture: restaurant.profilePicture,
        currency: restaurant.currency, isOpenNow: restaurant.isOpenNow, distance: restaurant.distance,
      },
    },
    now,
  );
}

async function resolveDishes(collection, point, places, now) {
  const rules = collection.rules ?? {};
  const placeById = new Map(places.map((r) => [String(r._id), r]));
  const pinIds = (collection.pins ?? []).map((id) => new mongoose.Types.ObjectId(String(id)));

  const pinnedDocs = pinIds.length
    ? await MenuItem.find({ _id: { $in: pinIds }, restaurant: { $in: places.map((r) => r._id) }, available: true }).lean()
    : [];
  const pins = pinOrder(pinIds, pinnedDocs);
  if (collection.manualOnly) return pins.map((item) => withRestaurant(item, placeById.get(String(item.restaurant)), now));

  const eligible = places.filter((r) => restaurantPasses(r, rules, now) && (!rules.maxPrice || (r.currency ?? DEFAULT_CURRENCY) === rules.currency));
  const items = await MenuItem.find({
    restaurant: { $in: eligible.map((r) => r._id) },
    available: true,
    _id: { $nin: pinIds },
    ...categoryFilter(rules.categories),
    ...(rules.onlyDeals ? liveDealFilter(now) : {}),
  })
    .limit(1000)
    .lean();

  const price = (item) => effectivePrice(item.price, item.promotion, now);
  let candidates = items.filter((item) => (!rules.maxPrice || price(item) <= rules.maxPrice) && (!rules.onlyDeals || isPromotionLive(item.promotion, now)));

  const popular = rules.sort === "popular" ? await popularity(point, places.map((r) => r._id), "items") : null;
  const place = (item) => placeById.get(String(item.restaurant));
  const sorters = {
    popular: (a, b) => (popular.get(String(b._id)) ?? 0) - (popular.get(String(a._id)) ?? 0) || rating(place(b)) - rating(place(a)),
    price: (a, b) => price(a) - price(b),
    discount: (a, b) => discountPercent(b.price, b.promotion, now) - discountPercent(a.price, a.promotion, now) || price(a) - price(b),
    rating: (a, b) => rating(place(b)) - rating(place(a)),
    distance: (a, b) => place(a).distance - place(b).distance,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  };
  candidates = candidates.sort(sorters[rules.sort] ?? sorters.popular);
  return [...pins, ...candidates].map((item) => withRestaurant(item, place(item), now));
}

async function resolve(collection, point, places, now = new Date()) {
  return collection.kind === "dishes"
    ? resolveDishes(collection, point, places, now)
    : resolveRestaurants(collection, point, places, now);
}

function publicMeta(collection, locale) {
  return {
    id: String(collection._id),
    slug: collection.slug,
    kind: collection.kind,
    title: localizedText(plain(collection.title), locale),
    subtitle: localizedText(plain(collection.subtitle), locale) || null,
    coverImage: collection.coverImage ?? null,
  };
}

const plain = (value) => (value instanceof Map ? Object.fromEntries(value) : value ?? {});

/** Live collections near a point for the discovery home, each with its first items. Rails with too few matches are left out. */
export async function listHomeCollections(query = {}, locale) {
  const point = pointOf(query);
  const cacheKey = `${areaKey(point)}:${locale}`;
  const cached = await homeCache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const collections = (await Collection.find({ status: "published" }).sort({ position: 1, createdAt: 1 }).lean()).filter((c) =>
    isCollectionLive(c, now),
  );
  let rails = [];
  if (collections.length) {
    const places = await nearby(point);
    if (places.length) {
      const resolved = await Promise.all(collections.map((c) => resolve(c, point, places, now)));
      rails = collections
        .map((c, i) => ({ c, items: resolved[i] }))
        .filter(({ items }) => items.length >= COLLECTION_LIMITS.minItems)
        .slice(0, COLLECTION_LIMITS.homeRails)
        .map(({ c, items }) => ({
          ...publicMeta(c, locale),
          items: items.slice(0, c.maxItems ?? COLLECTION_LIMITS.defaultItems),
          total: items.length,
          hasMore: items.length > (c.maxItems ?? COLLECTION_LIMITS.defaultItems),
        }));
    }
  }
  const result = { collections: rails };
  await homeCache.set(cacheKey, result);
  return result;
}

/** One live collection, paged. */
export async function getCollection(slug, query = {}, locale) {
  const point = pointOf(query);
  const collection = await Collection.findOne({ slug: String(slug ?? "").toLowerCase() }).lean();
  if (!collection || !isCollectionLive(collection)) throw collectionError("COLLECTION_NOT_FOUND", 404);
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const items = await resolve(collection, point, await nearby(point));
  return {
    collection: publicMeta(collection, locale),
    items: items.slice(skip, skip + limit),
    pagination: { page, limit, total: items.length, hasNext: skip + limit < items.length },
  };
}

function adminView(collection) {
  return { ...collection, id: String(collection._id), title: plain(collection.title), subtitle: plain(collection.subtitle) };
}

async function audit(actor, { action, targetId, reason = "", before, after, requestId }) {
  await AuditLog.create({
    actor: actor._id, actorEmail: actor.email, action, targetType: "collection", targetId, reason, before, after, requestId,
  });
}

function validate(input) {
  const result = normalizeCollectionInput(input);
  if (result.error) {
    const { code, ...params } = result.error;
    throw collectionError(code, 400, params);
  }
  return result.collection;
}

async function assertPins(collection) {
  if (!collection.pins.length) return;
  const Model = collection.kind === "dishes" ? MenuItem : Restaurant;
  const found = await Model.countDocuments({ _id: { $in: collection.pins } });
  if (found !== collection.pins.length) throw collectionError("COLLECTION_PINS", 400, { field: "pins" });
}

const assertId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw collectionError("COLLECTION_NOT_FOUND", 404);
};

const changed = () => homeCache.clear().catch(() => {});

export async function listAdminCollections(query = {}) {
  const filter = query.status ? { status: String(query.status) } : { status: { $ne: "archived" } };
  const collections = await Collection.find(filter).sort({ position: 1, createdAt: 1 }).lean();
  return { collections: collections.map(adminView) };
}

export async function getAdminCollection(id) {
  assertId(id);
  const collection = await Collection.findById(id).lean();
  if (!collection) throw collectionError("COLLECTION_NOT_FOUND", 404);
  return adminView(collection);
}

export async function createCollection({ actor, input, requestId }) {
  const data = validate(input);
  await assertPins(data);
  const last = await Collection.findOne().sort({ position: -1 }).select("position").lean();
  let created;
  try {
    created = await Collection.create({
      ...data,
      status: input?.status === "published" ? "published" : "draft",
      position: (last?.position ?? -1) + 1,
      createdBy: actor._id,
      updatedBy: actor._id,
    });
  } catch (error) {
    if (error?.code === 11000) throw collectionError("COLLECTION_SLUG_TAKEN", 409);
    throw error;
  }
  const after = created.toObject();
  await audit(actor, { action: "collection.create", targetId: created._id, after, requestId });
  await changed();
  return adminView(after);
}

export async function updateCollection({ actor, id, input, requestId }) {
  assertId(id);
  const data = validate(input);
  await assertPins(data);
  const before = await Collection.findById(id).lean();
  if (!before) throw collectionError("COLLECTION_NOT_FOUND", 404);
  const expected = input?.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null;
  if (expected && expected.getTime() !== new Date(before.updatedAt).getTime()) throw collectionError("COLLECTION_STATUS_CONFLICT", 409);
  let after;
  try {
    after = await Collection.findOneAndUpdate(
      { _id: id, updatedAt: before.updatedAt },
      { $set: { ...data, updatedBy: actor._id } },
      { new: true, runValidators: true },
    ).lean();
  } catch (error) {
    if (error?.code === 11000) throw collectionError("COLLECTION_SLUG_TAKEN", 409);
    throw error;
  }
  if (!after) throw collectionError("COLLECTION_STATUS_CONFLICT", 409);
  await audit(actor, { action: "collection.update", targetId: after._id, before, after, requestId });
  await changed();
  return adminView(after);
}

const TRANSITIONS = {
  publish: { from: ["draft"], to: "published" },
  unpublish: { from: ["published"], to: "draft" },
  archive: { from: ["draft", "published"], to: "archived" },
  restore: { from: ["archived"], to: "draft" },
};

export async function setCollectionStatus({ actor, id, action, requestId }) {
  assertId(id);
  const transition = TRANSITIONS[action];
  if (!transition) throw collectionError("COLLECTION_RULE", 400, { field: "action" });
  const before = await Collection.findById(id).lean();
  if (!before) throw collectionError("COLLECTION_NOT_FOUND", 404);
  const after = await Collection.findOneAndUpdate(
    { _id: id, status: { $in: transition.from } },
    { $set: { status: transition.to, updatedBy: actor._id } },
    { new: true },
  ).lean();
  if (!after) throw collectionError("COLLECTION_STATUS_CONFLICT", 409);
  await audit(actor, {
    action: `collection.${action}`, targetId: after._id, before: { status: before.status }, after: { status: after.status }, requestId,
  });
  await changed();
  return adminView(after);
}

export async function reorderCollections({ actor, ids, requestId }) {
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => !mongoose.Types.ObjectId.isValid(id)) || new Set(ids.map(String)).size !== ids.length) {
    throw collectionError("COLLECTION_RULE", 400, { field: "ids" });
  }
  const found = await Collection.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) throw collectionError("COLLECTION_NOT_FOUND", 404);
  await Collection.bulkWrite(ids.map((id, position) => ({ updateOne: { filter: { _id: id }, update: { $set: { position } } } })));
  await audit(actor, { action: "collection.reorder", targetId: ids[0], after: { ids }, requestId });
  await changed();
  return listAdminCollections();
}

/** What an unsaved collection would show at a point, for the admin form. */
export async function previewCollection({ input, query }) {
  const data = validate(input);
  const point = pointOf(query);
  const items = await resolve(data, point, await nearby(point));
  return { items: items.slice(0, data.maxItems), total: items.length };
}

/** Restaurants or dishes to pin, by name. */
export async function searchPinCandidates({ kind, q }) {
  const regex = containsRegex(String(q ?? "").slice(0, 60));
  if (!regex) return { results: [] };
  if (kind === "dishes") {
    const items = await MenuItem.find({ name: regex, deletedAt: null }).limit(20).populate("restaurant", "name").select("name price restaurant").lean();
    return { results: items.map((i) => ({ id: String(i._id), name: i.name, restaurantName: i.restaurant?.name ?? null, price: i.price })) };
  }
  const restaurants = await Restaurant.find({ name: regex }).limit(20).select("name cuisineType isActive").lean();
  return { results: restaurants.map((r) => ({ id: String(r._id), name: r.name, cuisineType: r.cuisineType, isActive: r.isActive })) };
}

/** Names for the pins an admin form is showing. */
export async function describePins({ kind, ids }) {
  const valid = (Array.isArray(ids) ? ids : String(ids ?? "").split(",")).filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!valid.length) return { results: [] };
  if (kind === "dishes") {
    const items = await MenuItem.find({ _id: { $in: valid } }).populate("restaurant", "name").select("name price restaurant").lean();
    return { results: pinOrder(valid, items).map((i) => ({ id: String(i._id), name: i.name, restaurantName: i.restaurant?.name ?? null, price: i.price })) };
  }
  const restaurants = await Restaurant.find({ _id: { $in: valid } }).select("name cuisineType isActive").lean();
  return { results: pinOrder(valid, restaurants).map((r) => ({ id: String(r._id), name: r.name, cuisineType: r.cuisineType, isActive: r.isActive })) };
}
