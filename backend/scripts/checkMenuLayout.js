// Seller-defined menu sections: saving a layout, what the customer menu shows
// for it, and every way a layout save is refused without changing anything.
//
//   node scripts/checkMenuLayout.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 9500 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");

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
  const menuService = await import("../services/menuItem.service.js");

  const makeRestaurant = async (tag) => {
    const owner = await User.create({ name: tag, email: `${tag}@layout.test`, password: "x", role: "seller" });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: tag, email: `r-${tag}@layout.test`, phone: "0622222222", cuisineType: "pizza",
      description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true,
    });
    return { owner, restaurant, token: generateToken(owner, null, false, { skipCookie: true }) };
  };
  const dish = (restaurant, owner, name, category, extra = {}) =>
    MenuItem.create({
      restaurant: restaurant._id, owner: owner._id, name, description: "d", price: 500, category,
      available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/d.jpg"], ...extra,
    });

  const { owner, restaurant, token } = await makeRestaurant("seller");
  const other = await makeRestaurant("other");
  const customer = await User.create({ name: "C", email: "c@layout.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const customerToken = generateToken(customer, null, false, { skipCookie: true });

  const burger = await dish(restaurant, owner, "Burger", "Burgers");
  const fries = await dish(restaurant, owner, "Fries", "Burgers");
  const cola = await dish(restaurant, owner, "Cola", "Drinks");
  const pancakes = await dish(restaurant, owner, "Pancakes", "Breakfast");
  const hidden = await dish(restaurant, owner, "Off menu", "Drinks", { available: false });
  const foreign = await dish(other.restaurant, other.owner, "Theirs", "Pizza");

  const call = async (method, p, body, auth = token) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", Authorization: `Bearer ${auth}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const layout = () => call("GET", "/api/restaurant/menu-layout");
  const save = (sections, auth) => call("PUT", "/api/restaurant/menu-layout", { sections }, auth);
  const menu = async () => (await call("GET", `/api/restaurants/${restaurant._id}/menu`)).body?.menu ?? [];
  const groups = async () => {
    const list = await menu();
    return list.map((group) => `${group.label ?? group.category}:${group.items.map((i) => i.name).join("|")}`);
  };
  const id = (doc) => String(doc._id);

  console.log("\nbefore any sections");
  let r = await layout();
  ok("the layout starts with every dish unsectioned", r.status === 200 && r.body.data.sections.length === 0 && r.body.data.unsectioned.length === 5,
    JSON.stringify(r.body).slice(0, 120));
  ok("the customer menu is the category grouping it always was",
    JSON.stringify(await groups()) === JSON.stringify(["Breakfast:Pancakes", "Burgers:Burger|Fries", "Drinks:Cola"]),
    JSON.stringify(await groups()));

  console.log("\nsaving a layout");
  r = await save([
    { name: "Combos", itemIds: [id(fries), id(burger)] },
    { name: "Drinks & more", itemIds: [id(cola)] },
  ]);
  ok("a layout saves", r.status === 200, `${r.status} ${r.body?.code}`);
  const [combos, drinks] = r.body.data?.sections ?? [];
  ok("sections come back in order with their dishes in order",
    combos?.name === "Combos" && combos.items.map((i) => i.name).join() === "Fries,Burger" && drinks?.items[0]?.name === "Cola");
  ok("dishes left out stay unsectioned", r.body.data?.unsectioned.map((i) => i.name).sort().join() === "Off menu,Pancakes");
  ok("the customer sees the sections first, in the seller's order, then the rest by category",
    JSON.stringify(await groups()) === JSON.stringify(["Combos:Fries|Burger", "Drinks & more:Cola", "Breakfast:Pancakes"]),
    JSON.stringify(await groups()));
  const firstGroup = (await menu())[0];
  ok("a section group carries its id for anchoring", firstGroup?.sectionId === String(combos?._id));

  console.log("\nrenaming and reordering keep dishes attached");
  r = await save([
    { _id: drinks._id, name: "Drinks", itemIds: [id(cola)] },
    { _id: combos._id, name: "Meal deals", itemIds: [id(burger), id(fries)] },
  ]);
  ok("a rename and a reorder save", r.status === 200, r.body?.code);
  ok("the section ids are the same ones", String(r.body.data.sections[1]._id) === String(combos._id));
  ok("the customer menu follows",
    JSON.stringify(await groups()) === JSON.stringify(["Drinks:Cola", "Meal deals:Burger|Fries", "Breakfast:Pancakes"]),
    JSON.stringify(await groups()));

  console.log("\nrefusals change nothing");
  const before = JSON.stringify((await layout()).body.data);
  const refused = async (label, sections, extra) => {
    r = await save(sections);
    ok(`${label} is a 400 MENU_LAYOUT_INVALID`, r.status === 400 && r.body?.code === "MENU_LAYOUT_INVALID", `${r.status} ${r.body?.code}`);
    if (extra) extra();
  };
  await refused("a layout that is not a list", "nope");
  await refused("a blank section name", [{ name: "  ", itemIds: [] }]);
  await refused("a name over 40 characters", [{ name: "x".repeat(41), itemIds: [] }]);
  await refused("two sections with the same name in different case", [{ name: "Drinks" }, { name: "drinks" }]);
  await refused("31 sections", Array.from({ length: 31 }, (_, i) => ({ name: `S${i}` })));
  await refused("a section id that is not this restaurant's", [{ _id: String(new mongoose.Types.ObjectId()), name: "X" }]);
  await refused("another restaurant's dish", [{ name: "X", itemIds: [id(foreign)] }]);
  await refused("the same dish twice", [{ name: "A", itemIds: [id(cola)] }, { name: "B", itemIds: [id(cola)] }]);
  await refused("an id that is not an id", [{ name: "A", itemIds: ["nope"] }]);
  await MenuItem.updateOne({ _id: pancakes._id }, { $set: { deletedAt: new Date() } });
  await refused("a deleted dish", [{ name: "A", itemIds: [id(pancakes)] }]);
  await MenuItem.updateOne({ _id: pancakes._id }, { $set: { deletedAt: null } });
  ok("after all of that the layout is unchanged", JSON.stringify((await layout()).body.data) === before);

  console.log("\nwho can touch it");
  r = await layout();
  ok("a seller only ever sees their own menu", !JSON.stringify(r.body).includes("Theirs"));
  r = await call("GET", "/api/restaurant/menu-layout", null, customerToken);
  ok("a customer is refused", r.status === 403, String(r.status));
  r = await save([], customerToken);
  ok("and cannot save one", r.status === 403, String(r.status));

  console.log("\ndishes from the item form");
  const meal = (await layout()).body.data.sections.find((s) => s.name === "Meal deals");
  const nuggets = await menuService.createNewMenuItem({
    restaurantId: String(restaurant._id), userId: owner._id, name: "Nuggets", description: "d", price: "400",
    category: "Burgers", available: "true", imageUrls: ["https://res.cloudinary.com/demo/image/upload/n.jpg"],
    sectionId: String(meal._id),
  });
  let current = (await layout()).body.data.sections.find((s) => s.name === "Meal deals");
  ok("a new dish saved into a section goes at its end", current.items.map((i) => i.name).join() === "Burger,Fries,Nuggets");
  let code = null;
  try {
    await menuService.createNewMenuItem({
      restaurantId: String(restaurant._id), userId: owner._id, name: "Ghost", description: "d", price: "400",
      category: "Burgers", available: "true", imageUrls: ["https://res.cloudinary.com/demo/image/upload/g.jpg"],
      sectionId: String(new mongoose.Types.ObjectId()),
    });
  } catch (error) {
    code = error.code;
  }
  ok("a section that does not exist is refused", code === "MENU_LAYOUT_INVALID", code);

  const drinksSection = (await layout()).body.data.sections.find((s) => s.name === "Drinks");
  await menuService.updateMenuItem({
    restaurantId: String(restaurant._id), menuItemId: id(nuggets), userId: owner._id, name: "Nuggets", description: "d",
    price: "400", category: "Burgers", available: "true", existingImages: nuggets.imageUrls, newFiles: [],
    sectionId: String(drinksSection._id),
  });
  current = (await layout()).body.data;
  ok("editing a dish into another section moves it to that section's end",
    current.sections.find((s) => s.name === "Drinks").items.map((i) => i.name).join() === "Cola,Nuggets" &&
      !current.sections.find((s) => s.name === "Meal deals").items.some((i) => i.name === "Nuggets"));
  await menuService.updateMenuItem({
    restaurantId: String(restaurant._id), menuItemId: id(nuggets), userId: owner._id, name: "Nuggets", description: "d",
    price: "400", category: "Burgers", available: "true", existingImages: nuggets.imageUrls, newFiles: [],
  });
  ok("an edit that sends no section leaves it where it is",
    (await layout()).body.data.sections.find((s) => s.name === "Drinks").items.some((i) => i.name === "Nuggets"));
  await menuService.updateMenuItem({
    restaurantId: String(restaurant._id), menuItemId: id(nuggets), userId: owner._id, name: "Nuggets", description: "d",
    price: "400", category: "Burgers", available: "true", existingImages: nuggets.imageUrls, newFiles: [],
    sectionId: "",
  });
  ok("an empty section takes it out of every section",
    (await layout()).body.data.unsectioned.some((i) => i.name === "Nuggets"));

  console.log("\ndeleting a section");
  r = await save([{ _id: drinksSection._id, name: "Drinks", itemIds: [id(cola)] }]);
  current = r.body.data;
  ok("its dishes go back to unsectioned", current.sections.length === 1 &&
    ["Burger", "Fries"].every((name) => current.unsectioned.some((i) => i.name === name)));
  ok("and the customer sees them under their category again",
    JSON.stringify(await groups()) === JSON.stringify(["Drinks:Cola", "Breakfast:Pancakes", "Burgers:Burger|Fries|Nuggets"]),
    JSON.stringify(await groups()));
  ok("unavailable dishes never reach the customer menu", !JSON.stringify(await menu()).includes("Off menu"));
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
