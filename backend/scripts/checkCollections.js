// Editorial collections end to end: admin create/update/publish/reorder with
// audit rows, rule evaluation against what is near the viewer, pins, the home
// rails and a collection's own page.
//
//   node scripts/checkCollections.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 10700 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const HERE = { lat: 44.8, lon: 20.45 };

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.JWT_SECRET = randomBytes(48).toString("base64url");
process.env.LOG_LEVEL = "silent";

const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", MAIL_DISABLED: "true", REDIS_URL: "" },
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: AuditLog } = await import("../models/AuditLog.js");
  const { generateToken } = await import("../utils/generateToken.js");
  await Restaurant.init();

  const token = (user) => generateToken(user, null, false, { skipCookie: true });
  const call = async (method, p, auth, body, params = {}) => {
    const url = new URL(BASE + p);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const pub = (p, params = {}, headers = {}) => {
    const url = new URL(BASE + p);
    for (const [k, v] of Object.entries({ ...HERE, ...params })) url.searchParams.set(k, v);
    return fetch(url, { headers }).then(async (res) => ({ status: res.status, body: await res.json().catch(() => ({})) }));
  };

  const adminUser = await User.create({ name: "A", email: "a@coll.test", password: "x", role: "customer", phoneNumber: "0600000000", isAdmin: true });
  const customer = await User.create({ name: "C", email: "c@coll.test", password: "x", role: "customer", phoneNumber: "0600000001" });
  const adminToken = token(adminUser);

  let n = 0;
  const restaurant = async (name, { cuisineType = "burgers", rating = 4, open = true, km = 1, daysOld = 100 } = {}) => {
    const owner = await User.create({ name: `O${++n}`, email: `o${n}@coll.test`, password: "x", role: "seller" });
    const r = await Restaurant.create({
      ownerId: owner._id, name, email: `r${n}@coll.test`, phone: "0622222222", cuisineType, description: "t",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [HERE.lon + km / 79, HERE.lat] },
      isActive: true, isOpenNow: open, averageRating: rating, totalReviews: 10, currency: "RSD",
    });
    await Restaurant.collection.updateOne({ _id: r._id }, { $set: { createdAt: new Date(Date.now() - daysOld * 86_400_000) } });
    r.owner = owner;
    return r;
  };
  const dish = (r, name, price, category = "Burgers", extra = {}) =>
    MenuItem.create({
      restaurant: r._id, owner: r.owner._id, name, description: "d", price, category, available: true,
      imageUrls: ["https://res.cloudinary.com/demo/image/upload/d.jpg"], ...extra,
    });

  const b1 = await restaurant("Burger One", { rating: 4.8, km: 3 });
  const b2 = await restaurant("Burger Two", { rating: 4.2, km: 1 });
  const b3 = await restaurant("Burger Three", { rating: 4.6, km: 2, open: false });
  const b4 = await restaurant("Burger Four", { rating: 3.5, km: 1.5, daysOld: 5 });
  const pasta = await restaurant("Pasta Place", { cuisineType: "italian", rating: 4.9, km: 1 });
  const far = await restaurant("Burger Far", { rating: 5, km: 40 });
  await dish(b1, "Classic", 450);
  await dish(b1, "Double", 900);
  await dish(b2, "Cheese", 520, "Burgers", { promotion: { isActive: true, type: "percentage", value: 20 } });
  await dish(b3, "Smash", 380);
  const fries = await dish(b4, "Fries", 200, "Sides");
  await dish(pasta, "Carbonara", 480, "Pasta");
  await dish(far, "Cheap", 100);

  console.log("\nadmin access and validation");
  let r = await call("GET", "/api/admin/collections", token(customer));
  ok("non-admins get a 404", r.status === 404, String(r.status));
  r = await call("POST", "/api/admin/collections", adminToken, { kind: "restaurants", title: { en: "" } });
  ok("a title is required", r.status === 400 && r.body?.code === "COLLECTION_TITLE", `${r.status} ${r.body?.code}`);
  r = await call("POST", "/api/admin/collections", adminToken, { kind: "restaurants", title: { en: "X" }, rules: { cuisines: ["martian"] } });
  ok("unknown cuisines are refused", r.body?.code === "COLLECTION_RULE", r.body?.code);
  r = await call("POST", "/api/admin/collections", adminToken, { kind: "restaurants", title: { en: "X" }, rules: { maxPrice: 500 } });
  ok("a price cap only applies to dishes", r.body?.code === "COLLECTION_RULE");
  r = await call("POST", "/api/admin/collections", adminToken, { kind: "dishes", title: { en: "X" }, pins: [String(new mongoose.Types.ObjectId())] });
  ok("pins must exist", r.body?.code === "COLLECTION_PINS", r.body?.code);
  r = await call("POST", "/api/admin/collections", adminToken, {
    kind: "restaurants", title: { en: "X" }, startsAt: "2026-10-10", endsAt: "2026-10-01",
  });
  ok("dates must be in order", r.body?.code === "COLLECTION_DATES", r.body?.code);

  console.log("\nrules near the viewer");
  r = await call("POST", "/api/admin/collections", adminToken, {
    kind: "restaurants", title: { en: "Best burgers", sr: "Najbolji burgeri" }, subtitle: { en: "Rated 4+" },
    rules: { cuisines: ["burgers"], minRating: 4, sort: "rating" },
  });
  const best = r.body?.data;
  ok("an admin creates a collection as a draft with a slug", r.status === 201 && best?.slug === "best-burgers" && best.status === "draft",
    `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  ok("and it is audited", (await AuditLog.countDocuments({ targetType: "collection", action: "collection.create" })) === 1);
  r = await call("POST", "/api/admin/collections", adminToken, { kind: "restaurants", title: { en: "Other" }, slug: "best-burgers" });
  ok("slugs are unique", r.status === 409 && r.body?.code === "COLLECTION_SLUG_TAKEN", `${r.status} ${r.body?.code}`);

  r = await pub("/api/discover/collections");
  ok("a draft is not on the home", r.status === 200 && r.body.collections?.length === 0, JSON.stringify(r.body).slice(0, 120));

  r = await call("POST", `/api/admin/collections/${best.id}/status`, adminToken, { action: "publish" });
  ok("publishing", r.status === 200 && r.body?.data?.status === "published");
  r = await call("POST", `/api/admin/collections/${best.id}/status`, adminToken, { action: "publish" });
  ok("publishing twice is a conflict", r.status === 409 && r.body?.code === "COLLECTION_STATUS_CONFLICT");

  r = await pub("/api/discover/collections");
  let rail = r.body.collections?.[0];
  ok("the home shows the published rail, highest rated first, nearby only",
    JSON.stringify(rail?.items?.map((x) => x.name)) === JSON.stringify(["Burger One", "Burger Three", "Burger Two"]),
    JSON.stringify(rail?.items?.map((x) => x.name)));
  ok("titled in the viewer's language", rail?.title === "Best burgers" && rail.subtitle === "Rated 4+");
  r = await pub("/api/discover/collections", {}, { "X-Locale": "sr" });
  ok("and in Serbian, falling back to English for a missing subtitle",
    r.body.collections?.[0]?.title === "Najbolji burgeri" && r.body.collections[0].subtitle === "Rated 4+", JSON.stringify(r.body.collections?.[0]).slice(0, 120));
  r = await pub("/api/discover/collections", { lat: 46.5, lon: 20.45 });
  ok("a rail with fewer than three matches nearby is hidden", r.body.collections?.length === 0);

  r = await call("PUT", `/api/admin/collections/${best.id}`, adminToken, {
    kind: "restaurants", slug: "best-burgers", title: { en: "Best burgers" }, rules: { cuisines: ["burgers"], minRating: 4, openNow: true, sort: "distance" },
    pins: [String(pasta._id)],
  });
  ok("an update applies", r.status === 200 && r.body?.data?.rules?.openNow === true, `${r.status} ${r.body?.code}`);
  const stale = await call("PUT", `/api/admin/collections/${best.id}`, adminToken, {
    kind: "restaurants", slug: "best-burgers", title: { en: "Stale" }, expectedUpdatedAt: best.updatedAt,
  });
  ok("an edit made from an older copy is refused", stale.status === 409 && stale.body?.code === "COLLECTION_STATUS_CONFLICT",
    `${stale.status} ${stale.body?.code}`);
  const bad = await call("PUT", `/api/admin/collections/${best.id}`, adminToken, { kind: "restaurants", title: { en: "X" }, rules: { minRating: 9 } });
  ok("errors name the field", bad.status === 400 && bad.body?.details?.field === "rules.minRating", JSON.stringify(bad.body).slice(0, 160));
  r = await pub("/api/discover/collections");
  rail = r.body.collections?.[0];
  ok("the home sees the change at once, pins first, then the rules",
    JSON.stringify(rail?.items?.map((x) => x.name)) === JSON.stringify(["Pasta Place", "Burger Two", "Burger One"]),
    JSON.stringify(rail?.items?.map((x) => x.name)));

  r = await call("POST", "/api/admin/collections", adminToken, {
    kind: "dishes", title: { en: "Under 500 RSD" }, rules: { maxPrice: 500, currency: "RSD", sort: "price" }, status: "published",
  });
  const cheap = r.body?.data;
  r = await pub("/api/discover/collections");
  rail = r.body.collections?.find((c) => c.slug === "under-500-rsd");
  ok("a dish rule caps the price after deals, cheapest first",
    JSON.stringify(rail?.items?.map((x) => x.name)) === JSON.stringify(["Fries", "Smash", "Cheese", "Classic", "Carbonara"]),
    JSON.stringify(rail?.items?.map((x) => [x.name, x.promotionalPrice])));
  ok("dishes carry their restaurant and promoted price",
    rail?.items?.find((x) => x.name === "Cheese")?.promotionalPrice === 416 && rail.items.every((x) => x.restaurant?.name));

  r = await call("POST", "/api/admin/collections", adminToken, {
    kind: "dishes", title: { en: "Deals" }, rules: { onlyDeals: true }, status: "published",
  });
  r = await pub("/api/discover/collections");
  ok("a deals rail with one match stays hidden", !r.body.collections?.some((c) => c.slug === "deals"));

  r = await call("POST", "/api/admin/collections", adminToken, {
    kind: "dishes", title: { en: "Sides" }, manualOnly: true, pins: [String(fries._id)], status: "published",
  });
  ok("a manual collection needs only pins", r.status === 201, r.body?.code);

  console.log("\norder and pages");
  r = await call("PUT", "/api/admin/collections/order", adminToken, { ids: [cheap.id, best.id] });
  ok("reordering returns the new order", r.status === 200 && r.body?.data?.collections?.[0]?.id === cheap.id, `${r.status} ${r.body?.code}`);
  r = await pub("/api/discover/collections");
  ok("and the home follows it", r.body.collections?.[0]?.slug === "under-500-rsd", JSON.stringify(r.body.collections?.map((c) => c.slug)));

  r = await pub("/api/discover/collections/under-500-rsd", { limit: 2 });
  ok("a collection's own page is paged", r.status === 200 && r.body.items?.length === 2 && r.body.pagination?.total === 5 &&
    r.body.pagination.hasNext === true && r.body.collection?.title === "Under 500 RSD", JSON.stringify(r.body).slice(0, 200));
  r = await pub("/api/discover/collections/nope");
  ok("an unknown slug is a 404", r.status === 404 && r.body?.code === "COLLECTION_NOT_FOUND");

  r = await call("POST", "/api/admin/collections/preview", adminToken, { kind: "restaurants", title: { en: "Italian" }, rules: { cuisines: ["italian"] } }, HERE);
  ok("an admin previews unsaved rules", r.status === 200 && r.body?.data?.total === 1 && r.body.data.items[0].name === "Pasta Place");
  r = await call("GET", "/api/admin/collections/pins", adminToken, null, { kind: "dishes", q: "chee" });
  ok("pin search finds dishes with their restaurant", r.body?.data?.results?.[0]?.restaurantName === "Burger Two");
  r = await call("GET", "/api/admin/collections/pins", adminToken, null, { kind: "restaurants", ids: `${pasta._id},${b1._id}` });
  ok("and names pins in order", JSON.stringify(r.body?.data?.results?.map((x) => x.name)) === JSON.stringify(["Pasta Place", "Burger One"]));

  r = await call("POST", `/api/admin/collections/${cheap.id}/status`, adminToken, { action: "archive" });
  r = await pub("/api/discover/collections");
  ok("archiving takes it off the home", !r.body.collections?.some((c) => c.slug === "under-500-rsd"));
  r = await call("GET", "/api/admin/collections", adminToken);
  ok("and out of the default admin list", !r.body?.data?.collections?.some((c) => c.id === cheap.id));

  await call("PUT", `/api/admin/collections/${best.id}`, adminToken, {
    kind: "restaurants", slug: "best-burgers", title: { en: "Best burgers" }, endsAt: new Date(Date.now() - 1000).toISOString(),
    startsAt: new Date(Date.now() - 86_400_000).toISOString(),
  });
  r = await pub("/api/discover/collections");
  ok("a collection past its end date disappears", !r.body.collections?.some((c) => c.slug === "best-burgers"));
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
