// Cart quantities must be whole numbers within a sane range, whatever the
// client sends. Drives the real cart handlers against a throwaway in-memory
// database.
//
//   node scripts/checkCartQuantity.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { default: Cart } = await import("../models/Cart.js");
  const { addToCart, updateCartItemQuantity } = await import("../controllers/cartController.js");

  const owner = await User.create({ name: "O", email: "o@qty.test", password: "x", role: "seller" });
  const buyer = await User.create({ name: "B", email: "b@qty.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "R", email: "r@qty.test", phone: "0622222222", cuisineType: "pizza",
    description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });
  const dish = await MenuItem.create({
    restaurant: restaurant._id, owner: owner._id, name: "Pizza", description: "d", price: 9.5,
    category: "pizza", available: true, imageUrls: ["https://res.cloudinary.com/demo/image/upload/p.jpg"],
  });

  const call = (handler, { body = {}, params = {} } = {}) =>
    new Promise((resolve) => {
      handler(
        { body, params, user: { id: String(buyer._id), _id: buyer._id } },
        { status: () => ({ json: (payload) => resolve({ ok: true, payload }) }) },
        (error) => resolve({ ok: false, error }),
      );
    });
  const add = (quantity) => call(addToCart, { body: { menuItemId: String(dish._id), quantity } });
  const update = (quantity) =>
    call(updateCartItemQuantity, { body: { quantity }, params: { menuItemId: String(dish._id) } });
  const lineQuantity = async () => (await Cart.findOne({ user: buyer._id }).lean())?.items?.[0]?.quantity;

  console.log("\nadding to the basket");
  for (const [label, value] of [
    ["1.5", 1.5], ["0", 0], ["-2", -2], ["1e6", 1e6], ["51", 51], ["NaN", Number.NaN],
    ["an object", { $gt: 0 }], ["an array", [2]], ['"2.5"', "2.5"], ['"abc"', "abc"],
  ]) {
    const r = await add(value);
    ok(`${label} is refused`, !r.ok && r.error?.code === "QUANTITY_INVALID", r.error?.code ?? "accepted");
  }
  ok("nothing was stored", (await lineQuantity()) === undefined);

  let r = await add(undefined);
  ok("no quantity means one", r.ok && (await lineQuantity()) === 1);
  r = await add("2");
  ok('a numeric string "2" is accepted as 2, not concatenated', r.ok && (await lineQuantity()) === 3, String(await lineQuantity()));
  r = await add(47);
  ok("the line can reach 50", r.ok && (await lineQuantity()) === 50);
  r = await add(1);
  ok("but not go past it", !r.ok && r.error?.code === "QUANTITY_INVALID" && (await lineQuantity()) === 50);

  console.log("\nchanging a line's quantity");
  for (const [label, value] of [["1.5", 1.5], ["-1", -1], ["51", 51], ["missing", undefined], ["null", null], ['"3x"', "3x"]]) {
    r = await update(value);
    ok(`${label} is refused`, !r.ok && r.error?.code === "QUANTITY_INVALID", r.error?.code ?? "accepted");
  }
  r = await update(7);
  ok("7 is set", r.ok && (await lineQuantity()) === 7);
  r = await update("0");
  ok("0 removes the line", r.ok && (await lineQuantity()) === undefined);

  console.log("\nan unavailable dish");
  await MenuItem.updateOne({ _id: dish._id }, { $set: { available: false } });
  r = await add(1);
  ok("cannot be added to a basket", !r.ok && r.error?.code === "ITEM_UNAVAILABLE", r.error?.code ?? "accepted");
  await MenuItem.updateOne({ _id: dish._id }, { $set: { available: true } });

  console.log("\nthe schema backs it up");
  let schemaError = null;
  try {
    await Cart.create({
      user: new mongoose.Types.ObjectId(), restaurant: restaurant._id,
      items: [{ menuItem: dish._id, name: "Pizza", price: 9.5, quantity: 2.5 }],
    });
  } catch (error) {
    schemaError = error;
  }
  ok("a fractional quantity fails validation", schemaError?.name === "ValidationError");
  schemaError = null;
  try {
    await Cart.create({
      user: new mongoose.Types.ObjectId(), restaurant: restaurant._id,
      items: [{ menuItem: dish._id, name: "Pizza", price: 9.5, quantity: 500 }],
    });
  } catch (error) {
    schemaError = error;
  }
  ok("a quantity over 50 fails validation", schemaError?.name === "ValidationError");
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
