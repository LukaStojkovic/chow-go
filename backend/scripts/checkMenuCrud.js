/**
 * Menu CRUD contract, driven the way the mobile client drives it.
 *
 * Images are skipped: they would hit Cloudinary for real. The multipart field
 * encoding for promotions is exercised, since append-field rebuilding
 * promotion[isActive] into an object is the fragile part.
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const API = "http://localhost:8000/api";
let passed = 0;
let failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};

const json = async (m, p, token, b) => {
  const r = await fetch(`${API}${p}`, {
    method: m,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: b === undefined ? undefined : JSON.stringify(b),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

// Mirrors src/api/uploads.js#toFormData, minus the files.
const form = async (m, p, token, fields) => {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields))
    if (v !== undefined) body.append(k, String(v));
  const r = await fetch(`${API}${p}`, {
    method: m,
    headers: { "X-Client": "mobile", Authorization: `Bearer ${token}` },
    body,
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;
const Restaurant = (await import("../models/Restaurant.js")).default;
const MenuItem = (await import("../models/MenuItem.js")).default;

const seller = await User.findOne({
  email: /^smoke-seller-.*@smoke\.test$/,
}).lean();
const customer = await User.findOne({
  email: /^smoke-customer-.*@smoke\.test$/,
}).lean();
const restaurant = await Restaurant.findOne({ ownerId: seller._id }).lean();
const login = (email) =>
  json("POST", "/auth/login", null, { email, password: "smoketest123" });
const sellerToken = (await login(seller.email)).body.token;

// A real Cloudinary URL is not needed: the update path only diffs strings.
const IMAGE = "https://res.cloudinary.com/demo/image/upload/v1/menu-check.png";
const customerToken = (await login(customer.email)).body.token;

console.log("\nlist");
const list = await json(
  "GET",
  `/restaurants/${restaurant._id}/menu-items?limit=50`,
  sellerToken,
);
ok(
  "unwraps to data.menuItems",
  Array.isArray(list.body.data?.menuItems),
  JSON.stringify(Object.keys(list.body.data ?? {})),
);
ok("carries pagination", Boolean(list.body.data?.pagination));

console.log("\ncreate");
const created = await form(
  "POST",
  `/restaurants/${restaurant._id}/menu`,
  sellerToken,
  {
    name: "Menu Check Salad",
    category: "Salads",
    price: "11.50",
    available: "true",
    description: "Fixture dish for the menu contract check.",
    "promotion[isActive]": "false",
  },
);
ok(
  "create accepts the mobile multipart fields",
  created.status < 400,
  `${created.status} ${created.body.message}`,
);
const createdId = created.body?.data?._id ?? created.body?.data?.menuItem?._id;
ok(
  "response carries the new id",
  Boolean(createdId),
  JSON.stringify(Object.keys(created.body?.data ?? {})).slice(0, 80),
);

console.log("\nfilters the list screen uses");
const search = await json(
  "GET",
  `/restaurants/${restaurant._id}/menu-items?search=Menu Check`,
  sellerToken,
);
ok(
  "search finds it",
  (search.body.data?.menuItems ?? []).some(
    (i) => String(i._id) === String(createdId),
  ),
);
const byCategory = await json(
  "GET",
  `/restaurants/${restaurant._id}/menu-items?category=Salads`,
  sellerToken,
);
ok(
  "category filter finds it",
  (byCategory.body.data?.menuItems ?? []).some(
    (i) => String(i._id) === String(createdId),
  ),
);

console.log("\npromotion via multipart");
const promoted = await form(
  "PUT",
  `/restaurants/${restaurant._id}/menu/${createdId}`,
  sellerToken,
  {
    name: "Menu Check Salad",
    category: "Salads",
    price: "11.50",
    available: "true",
    description: "Fixture dish for the menu contract check.",
    existingImages: IMAGE,
    "promotion[isActive]": "true",
    "promotion[type]": "percentage",
    "promotion[value]": "25",
    "promotion[label]": "Lunch deal",
  },
);
ok(
  "update accepts nested promotion fields",
  promoted.status < 400,
  `${promoted.status} ${promoted.body.message}`,
);

const stored = await MenuItem.findById(createdId).lean();
ok(
  "append-field rebuilt promotion into an object",
  typeof stored.promotion === "object" && stored.promotion?.isActive === true,
  JSON.stringify(stored.promotion),
);
ok(
  "the numeric value survived as a number",
  stored.promotion?.value === 25,
  String(stored.promotion?.value),
);

const { resolvePromotion } =
  await import("file:///D:/chow-go/shared/src/promotion.js");
const resolved = resolvePromotion(stored.price, stored.promotion);
ok(
  "the row renders a discounted price",
  resolved.discountPercent === 25 && resolved.price < stored.price,
  JSON.stringify(resolved),
);

console.log("\nlimits the server enforces");
const tooDeep = await form(
  "PUT",
  `/restaurants/${restaurant._id}/menu/${createdId}`,
  sellerToken,
  {
    name: "Menu Check Salad",
    category: "Salads",
    price: "11.50",
    available: "true",
    description: "Fixture dish for the menu contract check.",
    existingImages: IMAGE,
    "promotion[isActive]": "true",
    "promotion[type]": "percentage",
    "promotion[value]": "95",
  },
);
ok("a 95% discount is refused", tooDeep.status >= 400, `got ${tooDeep.status}`);

console.log("\ncustomer-facing read reflects the change");
const publicMenu = await json(
  "GET",
  `/restaurants/${restaurant._id}/menu`,
  null,
);
const group = (publicMenu.body.menu ?? []).find((g) => g.category === "Salads");
const publicItem = (group?.items ?? []).find(
  (i) => String(i._id) === String(createdId),
);
ok("the dish appears on the public menu", Boolean(publicItem));
ok(
  "the server resolved the price for customers",
  publicItem?.promotionalPrice < publicItem?.price,
  `${publicItem?.promotionalPrice} vs ${publicItem?.price}`,
);

console.log("\nownership");
const asCustomer = await form(
  "POST",
  `/restaurants/${restaurant._id}/menu`,
  customerToken,
  {
    name: "Not allowed",
    category: "Salads",
    price: "1.00",
    available: "true",
    "promotion[isActive]": "false",
  },
);
ok(
  "a customer cannot add a dish",
  asCustomer.status >= 400,
  `got ${asCustomer.status}`,
);

console.log("\ndelete");
const deleted = await json(
  "DELETE",
  `/restaurants/${restaurant._id}/menu/${createdId}`,
  sellerToken,
);
ok(
  "delete succeeds",
  deleted.status < 400,
  `${deleted.status} ${deleted.body.message}`,
);
ok("the dish is gone", !(await MenuItem.findById(createdId)));

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
