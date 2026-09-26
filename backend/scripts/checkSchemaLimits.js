// Free-text fields have upper bounds, prices a ceiling, and coordinates must be
// a real [longitude, latitude]. Validates documents without a database.
//
//   node scripts/checkSchemaLimits.js
import mongoose from "mongoose";

process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const { default: User } = await import("../models/User.js");
const { default: MenuItem } = await import("../models/MenuItem.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
const { default: Addresses } = await import("../models/Addresses.js");
const { default: Order } = await import("../models/Order.js");

const id = () => new mongoose.Types.ObjectId();
const x = (n) => "x".repeat(n);

async function failsOn(doc, path) {
  try {
    await doc.validate();
    return false;
  } catch (error) {
    return Boolean(error.errors?.[path]);
  }
}
async function passes(doc) {
  try {
    await doc.validate();
    return true;
  } catch (error) {
    return Object.keys(error.errors ?? {}).join(",") || error.message;
  }
}

const dish = (over = {}) =>
  new MenuItem({ restaurant: id(), owner: id(), name: "Pizza", description: "d", price: 9, category: "pizza", ...over });
const restaurant = (over = {}) =>
  new Restaurant({
    ownerId: id(), name: "R", email: "r@limits.test", phone: "0622222222", cuisineType: "pizza", description: "d",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, ...over,
  });
const address = (over = {}) =>
  new Addresses({
    userId: id(), label: "Home", addressType: "house", fullAddress: "Knez Mihailova 10",
    location: { type: "Point", coordinates: [20.46, 44.81] }, ...over,
  });
const order = (over = {}) =>
  new Order({
    customer: id(), restaurant: id(), items: [{ menuItem: id(), name: "P", price: 9, quantity: 1 }],
    deliveryAddress: id(), subtotal: 9, deliveryFee: 2.5, tax: 0, total: 11.5, paymentMethod: "cash", ...over,
  });

console.log("\nat the limit is fine");
{ const r = await passes(new User({ name: x(100), email: "u@limits.test", password: "x", phoneNumber: "0600000000" })); ok("a 100-character user name", r === true, String(r)); }
ok("a dish at every limit", (await passes(dish({ name: x(120), description: x(1000), category: x(60), price: 100000 }))) === true);
{ const r = await passes(restaurant({ name: x(120), description: x(2000) })); ok("a restaurant at every limit", r === true, String(r)); }
{ const r = await passes(address({ fullAddress: x(300), notes: x(500), doorCode: x(100) })); ok("an address at every limit", r === true, String(r)); }
ok("an order at every limit", (await passes(order({ customerNotes: x(500) }))) === true);

console.log("\none past it is refused");
ok("user name 101", await failsOn(new User({ name: x(101), email: "u@limits.test", password: "x" }), "name"));
ok("dish name 121", await failsOn(dish({ name: x(121) }), "name"));
ok("dish description 1001", await failsOn(dish({ description: x(1001) }), "description"));
ok("dish category 61", await failsOn(dish({ category: x(61) }), "category"));
ok("dish price over 100000", await failsOn(dish({ price: 100000.01 }), "price"));
ok("restaurant description 2001", await failsOn(restaurant({ description: x(2001) }), "description"));
ok("address notes 501", await failsOn(address({ notes: x(501) }), "notes"));
ok("address door code 101", await failsOn(address({ doorCode: x(101) }), "doorCode"));
ok("order notes 501", await failsOn(order({ customerNotes: x(501) }), "customerNotes"));
ok(
  "special instructions 201",
  await failsOn(order({ items: [{ menuItem: id(), name: "P", price: 9, quantity: 1, specialInstructions: x(201) }] }), "items.0.specialInstructions"),
);

console.log("\ncoordinates");
ok("[lat, lng] swapped out of range is refused", await failsOn(address({ location: { type: "Point", coordinates: [44.81, 200] } }), "location.coordinates"));
ok("a single number is refused", await failsOn(address({ location: { type: "Point", coordinates: [20.46] } }), "location.coordinates"));
ok("longitude 181 is refused on a restaurant", await failsOn(restaurant({ location: { type: "Point", coordinates: [181, 44.8] } }), "location.coordinates"));
{ const r = await passes(address()); ok("a real point is fine", r === true, String(r)); }

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
