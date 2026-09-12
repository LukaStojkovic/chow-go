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
      deliveryAddressSnapshot: { fullAddress: "A 1" },
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

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
