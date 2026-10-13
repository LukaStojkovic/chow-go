// Discovery search end to end: ranking, accent-insensitive matching, the
// filters, sorting and paging done on the server, typeahead, and trending.
//
//   node scripts/checkDiscoverSearch.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 10500 + Math.floor(Math.random() * 200);
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
  const { default: SearchTrend } = await import("../models/SearchTrend.js");
  await Restaurant.init();

  let n = 0;
  const restaurant = async (name, { cuisineType = "fast_food", open = true, active = true, eta = "30-45 min", rating = 0, km = 1 } = {}) => {
    const owner = await User.create({ name: `O${++n}`, email: `o${n}@search.test`, password: "x", role: "seller" });
    const r = await Restaurant.create({
      ownerId: owner._id, name, email: `r${n}@search.test`, phone: "0622222222", cuisineType, description: "Neighbourhood kitchen",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [HERE.lon + km / 79, HERE.lat] },
      isActive: active, isOpenNow: open, estimatedDeliveryTime: eta, averageRating: rating, totalReviews: rating ? 10 : 0,
    });
    r.owner = owner;
    return r;
  };
  const dish = (r, name, category = "Grill", extra = {}) =>
    MenuItem.create({
      restaurant: r._id, owner: r.owner._id, name, description: "d", price: 500, category, available: true,
      imageUrls: ["https://res.cloudinary.com/demo/image/upload/d.jpg"], ...extra,
    });
  const get = async (p, params = {}) => {
    const url = new URL(BASE + p);
    for (const [k, v] of Object.entries({ ...HERE, ...params })) url.searchParams.set(k, v);
    const res = await fetch(url);
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const names = (r) => (r.body?.restaurants ?? []).map((x) => x.name);

  const grill = await restaurant("Grill Kod Žike", { cuisineType: "serbian", rating: 4.2, eta: "20-30 min", km: 2 });
  const cevap = await restaurant("Ćevabdžinica Sarajevo", { cuisineType: "serbian", rating: 4.8, open: false, eta: "40-60 min", km: 3 });
  const trattoria = await restaurant("Trattoria Roma", { cuisineType: "italian", rating: 4.5, km: 1 });
  const far = await restaurant("Ćevapi Daleko", { cuisineType: "serbian", km: 40 });
  const hidden = await restaurant("Ćevapi Skriveno", { cuisineType: "serbian", active: false });
  await dish(grill, "Ćevapi u lepinji");
  await dish(grill, "Pljeskavica");
  await dish(cevap, "Ćevapi 10 komada");
  await dish(cevap, "Baklava", "Desserts");
  await dish(trattoria, "Tiramisu", "Desserts");
  await dish(trattoria, "Pizza Margherita", "Pizza");
  await dish(far, "Ćevapi");
  await dish(hidden, "Ćevapi");
  await dish(grill, "Ćevapi stari", "Grill", { available: false });

  console.log("\nmatching and ranking");
  let r = await get("/api/discover/search", { q: "cevapi" });
  ok("a search without accents finds dishes written with them", r.status === 200 && r.body.items?.length === 2,
    `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  ok("restaurants serving a matching dish are listed", names(r).includes("Grill Kod Žike") && names(r).includes("Ćevabdžinica Sarajevo"),
    JSON.stringify(names(r)));
  ok("far, inactive and unavailable dishes are left out", !names(r).some((x) => /Daleko|Skriveno/.test(x)) &&
    !r.body.items.some((i) => i.name === "Ćevapi stari"));
  ok("closed restaurants are included and say so", r.body.restaurants.find((x) => x.name.startsWith("Ćevab"))?.isOpenNow === false);
  ok("an open one ranks ahead of an equally relevant closed one", names(r)[0] === "Grill Kod Žike", JSON.stringify(names(r)));
  ok("dishes carry their restaurant", r.body.items.every((i) => i.restaurant?.name && i.restaurant?._id));
  r = await get("/api/discover/search", { q: "ćevab" });
  ok("a name match ranks first", names(r)[0] === "Ćevabdžinica Sarajevo", JSON.stringify(names(r)));
  r = await get("/api/discover/search", { q: "italijansk" });
  ok("a cuisine found by its Serbian label", JSON.stringify(names(r)) === JSON.stringify(["Trattoria Roma"]), JSON.stringify(names(r)));
  r = await get("/api/discover/search", { q: "dezert" });
  ok("a dish category found by its Serbian label", r.body.items?.length === 2 && r.body.items.every((i) => i.category === "Desserts"),
    JSON.stringify(r.body.items?.map((i) => i.name)));
  r = await get("/api/discover/search", { q: "(a+)+$" });
  ok("regex characters are literal", r.status === 200 && r.body.restaurants.length === 0);
  r = await get("/api/discover/search", { q: "c" });
  ok("a one-letter term returns nothing", r.status === 200 && r.body.restaurants.length === 0);
  r = await get("/api/discover/search", { query: "trattoria" });
  ok("the old query parameter still works", names(r)[0] === "Trattoria Roma");
  r = await fetch(`${BASE}/api/discover/search?q=pizza`);
  ok("a search without a location is a 400", r.status === 400, String(r.status));

  console.log("\nfilters and sorting");
  r = await get("/api/discover/search", { q: "cevapi", openNow: "true" });
  ok("open now drops closed restaurants and their dishes", JSON.stringify(names(r)) === JSON.stringify(["Grill Kod Žike"]) &&
    r.body.items.length === 1, JSON.stringify(names(r)));
  r = await get("/api/discover/search", { q: "cevapi", maxDeliveryTime: "30" });
  ok("delivery time filters on the upper bound", JSON.stringify(names(r)) === JSON.stringify(["Grill Kod Žike"]));
  ok("the applied filters are echoed", r.body.filters?.maxDeliveryTime === "30" && r.body.filters?.openNow === false);
  r = await get("/api/discover/search", { q: "kitchen", sort: "rating" });
  ok("sort by rating", JSON.stringify(names(r)) === JSON.stringify(["Ćevabdžinica Sarajevo", "Trattoria Roma", "Grill Kod Žike"]),
    JSON.stringify(names(r)));
  r = await get("/api/discover/search", { q: "kitchen", sort: "distance" });
  ok("sort by distance", JSON.stringify(names(r)) === JSON.stringify(["Trattoria Roma", "Grill Kod Žike", "Ćevabdžinica Sarajevo"]) &&
    r.body.restaurants.every((x) => typeof x.distance === "number"), JSON.stringify(names(r)));
  r = await get("/api/discover/search", { q: "kitchen", sort: "delivery_time" });
  ok("sort by delivery time", names(r)[0] === "Grill Kod Žike" && names(r)[2] === "Ćevabdžinica Sarajevo", JSON.stringify(names(r)));

  console.log("\npaging");
  for (let i = 1; i <= 12; i++) await restaurant(`Burger Spot ${i}`, { cuisineType: "burgers", km: 1 + i / 10 });
  r = await get("/api/discover/search", { q: "burger" });
  ok("more than five restaurants come back", r.body.restaurants.length === 10 && r.body.pagination?.total === 12 &&
    r.body.pagination.hasNext === true, JSON.stringify(r.body.pagination));
  r = await get("/api/discover/search", { q: "burger", page: 2 });
  ok("the next page has the rest and no dishes", r.body.restaurants.length === 2 && r.body.pagination.hasNext === false &&
    r.body.items.length === 0);

  console.log("\ntypeahead");
  r = await get("/api/discover/search/suggest", { q: "ćev" });
  const s = r.body.suggestions ?? [];
  ok("restaurants first", s[0]?.type === "restaurant" && s[0].label === "Ćevabdžinica Sarajevo", JSON.stringify(s));
  const dishes = s.filter((x) => x.type === "dish");
  ok("dish names deduplicated with how many places have them", dishes.length === 2 && dishes.every((d) => d.count === 1),
    JSON.stringify(dishes));
  r = await get("/api/discover/search/suggest", { q: "domać" });
  ok("a cuisine present nearby is suggested", r.body.suggestions?.some((x) => x.type === "cuisine" && x.value === "serbian"),
    JSON.stringify(r.body));
  r = await get("/api/discover/search/suggest", { q: "japan" });
  ok("a cuisine nobody nearby cooks is not", !r.body.suggestions?.some((x) => x.type === "cuisine"));
  r = await get("/api/discover/search/suggest", { q: "b" });
  ok("one letter suggests nothing", r.status === 200 && r.body.suggestions?.length === 0);

  console.log("\ntrending");
  for (let i = 0; i < 3; i++) await get("/api/discover/search", { q: "pljeskavica" });
  for (let i = 0; i < 3; i++) await get("/api/discover/search", { q: "pljesk" });
  for (let i = 0; i < 2; i++) await get("/api/discover/search", { q: "trattoria roma" });
  await new Promise((resolve) => setTimeout(resolve, 300));
  r = await get("/api/discover/search/trending");
  ok("a dish searched by its exact name three times is trending",
    r.body.trending?.[0]?.kind === "dish" && r.body.trending[0].value === "Pljeskavica" && r.body.trending[0].count === 3,
    JSON.stringify(r.body));
  ok("partial words and rarely searched names are not", r.body.trending?.length === 1);
  ok("free text is never stored", (await SearchTrend.countDocuments({ label: /pljesk$/i })) === 0);
  ok("nearby cuisines are listed, most common first", r.body.cuisines?.[0] === "burgers" && r.body.cuisines.includes("serbian"),
    JSON.stringify(r.body.cuisines));
  r = await get("/api/discover/search/trending", { lat: 45.8, lon: 20.45 });
  ok("trending is per area", r.body.trending?.length === 0 && r.body.cuisines?.length === 0);
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
