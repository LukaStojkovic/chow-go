// Order pricing: that a stored order's line items add up to its total, that
// the checkout preview and the stored order itemise the same way, and that
// nothing persists unrounded float noise.
//
// serviceFee used to be passed to the Order constructor and dropped by the
// schema, so subtotal + deliveryFee + tax + tip never reconciled with total,
// and priorityFee was folded into deliveryFee so the confirmation screen
// itemised differently from the checkout that produced it.
//
//   node scripts/checkOrderMoney.js
import "../config/env.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { toMoney } from "../utils/money.js";

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());

const { default: Order } = await import("../models/Order.js");
const { buildPriceBreakdown, breakdownFromOrder, PRICING } = await import(
  "../../shared/src/adapters/pricing.js"
);

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

try {
  console.log("\nthe backend and shared agree on the fees");
  ok("deliveryFee", PRICING.deliveryFee === 2.5);
  ok("serviceFee", PRICING.serviceFee === 1.5);
  ok("priorityFee", PRICING.priorityFee === 1.99);

  for (const [label, subtotal, deliveryType, tip] of [
    ["standard", 9.5, "standard", 0],
    ["priority with a tip", 20.1, "priority", 2],
    ["float-noisy subtotal", 0.1 + 0.2, "priority", 1.15],
  ]) {
    console.log(`\n${label}`);

    const priorityFee = deliveryType === "priority" ? PRICING.priorityFee : 0;
    const total = toMoney(
      toMoney(subtotal) + PRICING.deliveryFee + PRICING.serviceFee + priorityFee + toMoney(tip),
    );

    const order = await Order.create({
      customer: new mongoose.Types.ObjectId(),
      restaurant: new mongoose.Types.ObjectId(),
      status: "pending",
      items: [{ menuItem: new mongoose.Types.ObjectId(), name: "P", price: 1, quantity: 1 }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A 1", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal: toMoney(subtotal),
      deliveryFee: PRICING.deliveryFee,
      serviceFee: PRICING.serviceFee,
      priorityFee,
      tax: 0,
      tip: toMoney(tip),
      total,
      paymentMethod: "cash",
    });

    const stored = await Order.findById(order._id).lean();

    ok("serviceFee survived the schema", stored.serviceFee === PRICING.serviceFee, String(stored.serviceFee));
    ok("priorityFee survived the schema", stored.priorityFee === priorityFee, String(stored.priorityFee));

    const sum = toMoney(
      stored.subtotal + stored.deliveryFee + stored.serviceFee + stored.priorityFee +
      stored.tax + stored.tip - (stored.discount ?? 0),
    );
    ok("line items add up to total", sum === stored.total, `${sum} vs ${stored.total}`);

    for (const [field, value] of Object.entries(stored)) {
      if (typeof value !== "number") continue;
      if (!["subtotal", "deliveryFee", "serviceFee", "priorityFee", "tax", "tip", "total"].includes(field)) continue;
      ok(`${field} is stored rounded`, toMoney(value) === value, String(value));
    }

    const preview = buildPriceBreakdown({ subtotal, deliveryType, tip });
    const readBack = breakdownFromOrder(stored);
    const fields = ["subtotal", "deliveryFee", "serviceFee", "priorityFee", "tip", "tax", "total"];
    const mismatch = fields.find((f) => preview[f] !== readBack[f]);
    ok("checkout preview itemises like the stored order", !mismatch,
      mismatch ? `${mismatch}: ${preview[mismatch]} vs ${readBack[mismatch]}` : "");
  }

  console.log("\nwhole cents");
  const { toCents, sumMoney, lineTotal } = await import("../utils/money.js");
  const { default: Cart } = await import("../models/Cart.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  ok("1.005 rounds up to 1.01, not down", toMoney(1.005) === 1.01, String(toMoney(1.005)));
  ok("negative amounts round symmetrically", toMoney(-1.005) === -1.01);
  ok("toCents is an integer", toCents(19.99) === 1999 && toCents(0.07) === 7);
  ok("0.1 + 0.2 sums to exactly 0.3", sumMoney(0.1, 0.2) === 0.3);
  ok("0.1 x 3 is exactly 0.3", lineTotal(0.1, 3) === 0.3);
  const noisy = sumMoney(19.99, 2.5, 1.5, 1.99, 0, 1.15);
  ok("a full checkout sum has no float noise", noisy === 27.13, String(noisy));

  const cart = new Cart({
    user: new mongoose.Types.ObjectId(),
    restaurant: new mongoose.Types.ObjectId(),
    items: [
      { menuItem: new mongoose.Types.ObjectId(), name: "A", price: 0.1, quantity: 3 },
      { menuItem: new mongoose.Types.ObjectId(), name: "B", price: 0.2, quantity: 1 },
    ],
  });
  ok("a cart totals in cents", cart.totalPrice === 0.5, String(cart.totalPrice));
  ok("an unset basePrice stays unset", cart.items[0].basePrice === undefined);

  const item = new MenuItem({ name: "X", price: 9.999, promotion: { value: 12.345 } });
  ok("a menu price is kept to the cent", item.price === 10);
  ok("a promotion value is kept to the cent", item.promotion.value === 12.35, String(item.promotion.value));
  const bad = new MenuItem({ name: "X", price: "abc" });
  ok("a non-numeric price still fails validation", Boolean(bad.validateSync()?.errors?.price));

  const withCurrency = await Order.findOne().lean();
  ok("orders record their currency", withCurrency.currency === "USD", String(withCurrency.currency));

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
