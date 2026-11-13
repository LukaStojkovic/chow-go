// One-tap stock: a seller marks a dish or a single option sold out (for the
// rest of the day or until they switch it back), customers stop seeing or
// adding it at once, and the cron restocks timed ones on its own.
//
//   node scripts/checkMenuStock.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 11300 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const TZ = "Europe/Belgrade";

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
  const { generateToken } = await import("../utils/generateToken.js");
  const { restockDue } = await import("../services/menuStock.service.js");
  const { startOfDateKey } = await import("../utils/zonedTime.js");
  const { addDays, zonedDateKey } = await import("@chowgo/shared/dateKeys");

  const token = (user) => generateToken(user, null, false, { skipCookie: true });
  const call = async (method, p, auth, body) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const allDay = Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
  );
  const makeRestaurant = async (tag) => {
    const owner = await User.create({ name: `O${tag}`, email: `o${tag}@stock.test`, password: "x", role: "seller" });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: `R${tag}`, email: `r${tag}@stock.test`, phone: "0622222222", cuisineType: "pizza", description: "t",
      profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true, schedule: allDay, timezone: TZ, currency: "RSD",
    });
    return { owner, restaurant, token: token(owner) };
  };
  const a = await makeRestaurant("a");
  const b = await makeRestaurant("b");
  const customer = await User.create({ name: "C", email: "c@stock.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const customerToken = token(customer);

  const pizza = await MenuItem.create({
    restaurant: a.restaurant._id, owner: a.owner._id, name: "Pizza", description: "d", price: 1000, category: "Pizza", available: true,
    imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
    optionGroups: [{ name: "Extras", minSelect: 0, maxSelect: 2, options: [{ name: "Cheese", priceDelta: 100 }, { name: "Ham", priceDelta: 150 }] }],
  });
  const cola = await MenuItem.create({
    restaurant: a.restaurant._id, owner: a.owner._id, name: "Cola", description: "d", price: 200, category: "Drinks", available: true,
    imageUrls: ["https://res.cloudinary.com/demo/image/upload/c.jpg"],
  });
  const cheeseId = String(pizza.optionGroups[0].options[0]._id);
  const stock = (item, body, auth = a.token, restaurantId = a.restaurant._id) =>
    call("PATCH", `/api/restaurants/${restaurantId}/menu-items/${item._id ?? item}/stock`, auth, body);
  const menuNames = async () => {
    const r = await call("GET", `/api/restaurants/${a.restaurant._id}/menu`);
    return (r.body?.menu ?? []).flatMap((g) => g.items ?? []).map((i) => i.name);
  };

  console.log("\naccess and validation");
  let r = await stock(cola, { available: "no" });
  ok("available must be a boolean", r.status === 400 && r.body?.code === "STOCK_INVALID" && r.body?.details?.field === "available",
    `${r.status} ${r.body?.code}`);
  r = await stock(cola, { available: false, until: "nextWeek" });
  ok("only the known durations are accepted", r.body?.code === "STOCK_INVALID");
  r = await stock(cola, { available: false }, b.token, a.restaurant._id);
  ok("another seller cannot touch it", r.status === 403, String(r.status));
  r = await stock(cola, { available: false }, b.token, b.restaurant._id);
  ok("nor through their own restaurant's path", r.status === 404, String(r.status));
  r = await stock(cola, { available: false }, customerToken);
  ok("customers cannot", r.status === 403);

  console.log("\na dish");
  r = await stock(cola, { available: false });
  ok("one tap marks it sold out until switched back", r.status === 200 && r.body?.data?.menuItem?.available === false &&
    r.body.data.menuItem.soldOutUntil === null, JSON.stringify(r.body).slice(0, 160));
  ok("customers no longer see it", !(await menuNames()).includes("Cola"));
  r = await call("POST", "/api/cart/items", customerToken, { menuItemId: String(cola._id), quantity: 1 });
  ok("nor can they add it", r.status === 400 && r.body?.code === "ITEM_UNAVAILABLE", `${r.status} ${r.body?.code}`);
  ok("a sold-out dish without a timer is never restocked by the cron", (await restockDue(new Date(Date.now() + 7 * 86_400_000))).dishes === 0);
  r = await stock(cola, { available: true });
  ok("one tap brings it back", r.body?.data?.menuItem?.available === true && (await menuNames()).includes("Cola"));

  r = await stock(cola, { available: false, until: "endOfDay" });
  const midnight = startOfDateKey(addDays(zonedDateKey(new Date(), TZ), 1), TZ);
  ok("sold out for today ends at the restaurant's local midnight",
    new Date(r.body?.data?.menuItem?.soldOutUntil).getTime() === midnight.getTime(), r.body?.data?.menuItem?.soldOutUntil);
  let restocked = await restockDue(new Date());
  ok("the cron leaves it alone before then", restocked.dishes === 0 && (await MenuItem.findById(cola._id).lean()).available === false);
  restocked = await restockDue(new Date(midnight.getTime() + 1000));
  const back = await MenuItem.findById(cola._id).lean();
  ok("and restocks it after", restocked.dishes === 1 && back.available === true && back.soldOutUntil === null);

  console.log("\nan option");
  r = await stock(pizza, { available: false, optionId: cheeseId, until: "endOfDay" });
  const options = r.body?.data?.menuItem?.optionGroups?.[0]?.options ?? [];
  ok("one option is switched off and the dish stays on", r.status === 200 && r.body.data.menuItem.available === true &&
    options[0]?.available === false && options[0].soldOutUntil && options[1]?.available === true, JSON.stringify(options));
  r = await call("POST", "/api/cart/items", customerToken, { menuItemId: String(pizza._id), quantity: 1, options: [cheeseId] });
  ok("customers cannot pick it", r.status === 400 && r.body?.code === "OPTION_UNAVAILABLE", `${r.status} ${r.body?.code}`);
  r = await stock(pizza, { available: false, optionId: String(new mongoose.Types.ObjectId()) });
  ok("an unknown option is a 404", r.status === 404);

  const editForm = new FormData();
  for (const [k, v] of Object.entries({ name: "Pizza", description: "d", price: "1000", category: "Pizza", available: "true" })) editForm.append(k, v);
  editForm.append("existingImages", "https://res.cloudinary.com/demo/image/upload/p.jpg");
  const group = pizza.optionGroups[0];
  editForm.append("optionGroups", JSON.stringify([{
    _id: String(group._id), name: "Extras", minSelect: 0, maxSelect: 2,
    options: group.options.map((o, i) => ({ _id: String(o._id), name: o.name, priceDelta: o.priceDelta, available: i !== 0 })),
  }]));
  const edit = await fetch(`${BASE}/api/restaurants/${a.restaurant._id}/menu/${pizza._id}`, {
    method: "PUT", headers: { "X-Client": "mobile", Authorization: `Bearer ${a.token}` }, body: editForm,
  });
  const afterEdit = await MenuItem.findById(pizza._id).lean();
  ok("editing the dish keeps a switched-off option's restock time", edit.status === 200 &&
    afterEdit.optionGroups[0].options[0].available === false && Boolean(afterEdit.optionGroups[0].options[0].soldOutUntil), String(edit.status));

  restocked = await restockDue(new Date(midnight.getTime() + 1000));
  const pizzaBack = await MenuItem.findById(pizza._id).lean();
  ok("the cron restocks options too", restocked.options === 1 && pizzaBack.optionGroups[0].options[0].available === true &&
    pizzaBack.optionGroups[0].options[0].soldOutUntil === null);

  await stock(cola, { available: false, until: "endOfDay" });
  const formOn = new FormData();
  for (const [k, v] of Object.entries({ name: "Cola", description: "d", price: "200", category: "Drinks", available: "true" })) formOn.append(k, v);
  formOn.append("existingImages", "https://res.cloudinary.com/demo/image/upload/c.jpg");
  await fetch(`${BASE}/api/restaurants/${a.restaurant._id}/menu/${cola._id}`, {
    method: "PUT", headers: { "X-Client": "mobile", Authorization: `Bearer ${a.token}` }, body: formOn,
  });
  const colaOn = await MenuItem.findById(cola._id).lean();
  ok("switching it on in the editor clears the timer", colaOn.available === true && colaOn.soldOutUntil === null);

  await MenuItem.updateOne({ _id: cola._id }, { $set: { deletedAt: new Date() } });
  r = await stock(cola, { available: true });
  ok("a deleted dish cannot be restocked", r.status === 404);
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
