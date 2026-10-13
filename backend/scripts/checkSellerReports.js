// Seller reporting end to end: analytics over a date range with the previous
// period, CSV exports, weekly payout statements with admin settlement, and
// holiday closures closing the restaurant and its pre-order slots.
//
//   node scripts/checkSellerReports.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 10900 + Math.floor(Math.random() * 200);
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
  const { default: Order } = await import("../models/Order.js");
  const { default: AuditLog } = await import("../models/AuditLog.js");
  await import("../models/MenuItem.js");
  const { generateToken } = await import("../utils/generateToken.js");
  const { startOfDateKey } = await import("../utils/zonedTime.js");
  const { csvCell } = await import("../utils/csv.js");
  const { addDays, weekStartKey, zonedDateKey } = await import("@chowgo/shared/dateKeys");
  const { deliverySlots, schedulingInputs } = await import("@chowgo/shared/scheduling");

  const token = (user) => generateToken(user, null, false, { skipCookie: true });
  const call = async (method, p, auth, body, { headers = {}, raw = false } = {}) => {
    const res = await fetch(BASE + p, {
      method,
      headers: { "Content-Type": "application/json", "X-Client": "mobile", Authorization: `Bearer ${auth}`, ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, headers: res.headers, body: raw ? Buffer.from(await res.arrayBuffer()).toString("utf8") : await res.json().catch(() => ({})) };
  };

  const today = zonedDateKey(new Date(), TZ);
  const thisWeek = weekStartKey(today);
  const lastWeek = addDays(thisWeek, -7);
  const twoWeeksAgo = addDays(thisWeek, -14);
  const at = (key, hour) => new Date(startOfDateKey(key, TZ).getTime() + hour * 3600_000);

  const owner = await User.create({ name: "Owner", email: "o@rep.test", password: "x", role: "seller" });
  const other = await User.create({ name: "Other", email: "x@rep.test", password: "x", role: "seller" });
  const admin = await User.create({ name: "Admin", email: "a@rep.test", password: "x", role: "customer", phoneNumber: "0600000009", isAdmin: true });
  const customer = await User.create({ name: "Cust", email: "c@rep.test", password: "x", role: "customer", phoneNumber: "0600000000" });
  const weekly = Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
  );
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "Reports R", email: "r@rep.test", phone: "0622222222", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, isOpenNow: true, currency: "RSD", timezone: TZ, schedule: weekly,
  });
  await Restaurant.create({
    ownerId: other._id, name: "Other R", email: "r2@rep.test", phone: "0622222223", cuisineType: "pizza", description: "t",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] }, isActive: true, currency: "RSD",
  });
  const sellerToken = token(owner);
  const adminToken = token(admin);

  let n = 0;
  const order = async ({ placed, status = "delivered", subtotal = 1000, discount = 0, fundedBy, name = "Pizza", deliveredAt }) => {
    const o = await Order.create({
      orderNumber: `REP-${++n}`, customer: customer._id, restaurant: restaurant._id, status,
      items: [{ menuItem: new mongoose.Types.ObjectId(), name, price: subtotal, quantity: 1, options: [{ groupId: new mongoose.Types.ObjectId(), optionId: new mongoose.Types.ObjectId(), groupName: "Size", name: "Large", priceDelta: 0 }] }],
      deliveryAddress: new mongoose.Types.ObjectId(),
      deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
      subtotal, deliveryFee: 250, serviceFee: 150, discount, total: subtotal + 400 - discount, paymentMethod: "cash", currency: "RSD",
      ...(fundedBy ? { promo: { code: "SAVE", fundedBy, type: "fixed" } } : {}),
    });
    await Order.collection.updateOne(
      { _id: o._id },
      { $set: { createdAt: placed, ...(status === "delivered" ? { deliveredAt: deliveredAt ?? new Date(placed.getTime() + 1800_000) } : {}) } },
    );
    return o;
  };

  await order({ placed: at(twoWeeksAgo, 12), subtotal: 800 });
  await order({ placed: at(addDays(twoWeeksAgo, 6), 23.75), subtotal: 500, deliveredAt: at(lastWeek, 0.25) });
  await order({ placed: at(lastWeek, 12), subtotal: 1000, discount: 100, fundedBy: "restaurant" });
  await order({ placed: at(addDays(lastWeek, 2), 13), subtotal: 600, discount: 50, fundedBy: "platform", name: "=HYPERLINK(\"x\")" });
  await order({ placed: at(addDays(lastWeek, 3), 13), status: "cancelled", subtotal: 900 });
  await order({ placed: at(today, 0.5), subtotal: 400 });
  await order({ placed: at(today, 1), status: "pending", subtotal: 700 });

  console.log("\nanalytics over a range");
  let r = await call("GET", `/api/restaurants/${restaurant._id}/analytics?from=${lastWeek}&to=${addDays(lastWeek, 6)}`, sellerToken);
  let d = r.body?.data;
  ok("a custom range is applied", r.status === 200 && d?.range?.from === lastWeek && d.range.days === 7 && d.range.granularity === "day",
    `${r.status} ${JSON.stringify(d?.range)}`);
  ok("revenue counts delivered orders net of restaurant-funded discounts",
    d?.summary?.revenue === 900 + 600 && d.summary.orders === 2 && d.summary.cancelled === 1 && d.summary.discounts === 100,
    JSON.stringify(d?.summary));
  ok("an order placed late on Sunday counts on Sunday, not when it was delivered",
    d?.series?.[0]?.revenue === 900 && d.series.length === 7, JSON.stringify(d?.series?.slice(0, 2)));
  ok("the previous period is included for comparison", d?.summary?.previous?.revenue === 1300 && d.summary.previous.range.to === addDays(lastWeek, -1),
    JSON.stringify(d?.summary?.previous));
  ok("top items follow the range", d?.topItems?.length === 2, JSON.stringify(d?.topItems?.map((i) => i.name)));
  r = await call("GET", `/api/restaurants/${restaurant._id}/analytics?preset=last90`, sellerToken);
  ok("a 90-day preset is bucketed by week", r.body?.data?.range?.granularity === "week" && r.body.data.series.every((s) => s.key.length === 10),
    JSON.stringify(r.body?.data?.range));
  r = await call("GET", `/api/restaurants/${restaurant._id}/analytics?preset=thisYear`, sellerToken);
  ok("a long range is bucketed by month", r.body?.data?.range?.days <= 62 || r.body?.data?.series?.[0]?.key.endsWith("-01"));
  r = await call("GET", `/api/restaurants/${restaurant._id}/analytics`, sellerToken);
  ok("the default is the last 30 days and keeps the old fields",
    r.body?.data?.range?.days === 30 && r.body.data.range.to === today && r.body.data.dailyRevenue?.length === 7 && r.body.data.kpis);
  r = await call("GET", `/api/restaurants/${restaurant._id}/analytics?from=${today}&to=${lastWeek}`, sellerToken);
  ok("a reversed range is refused", r.status === 400 && r.body?.code === "REPORT_RANGE_INVALID", `${r.status} ${r.body?.code}`);
  r = await call("GET", `/api/restaurants/${restaurant._id}/analytics?from=2020-01-01&to=${today}`, sellerToken);
  ok("a range over a year is refused", r.body?.code === "REPORT_RANGE_TOO_LONG", r.body?.code);

  console.log("\nCSV export");
  r = await call("GET", `/api/restaurant/reports/orders.csv?from=${lastWeek}&to=${addDays(lastWeek, 6)}`, sellerToken, null, {
    raw: true, headers: { "X-Locale": "sr" },
  });
  const lines = r.body.slice(1).trim().split("\r\n");
  ok("a CSV attachment with a BOM", r.status === 200 && r.headers.get("content-type")?.startsWith("text/csv") &&
    /attachment; filename="orders_/.test(r.headers.get("content-disposition") ?? "") && r.body.charCodeAt(0) === 0xfeff, `${r.status}`);
  ok("headers in the seller's language", lines[0].startsWith("Porudžbina,Poručeno,Status"), lines[0]);
  ok("one row per order in the range, cancelled included", lines.length === 1 + 3, String(lines.length));
  ok("options are listed and earnings are net", lines.some((l) => l.includes("1x Pizza (Large)") && l.includes(",1000,100,900,")),
    lines.join(" | "));
  ok("text cells that start like a formula are neutralised", csvCell("=HYPERLINK(1)") === "'=HYPERLINK(1)" && csvCell("-SAVE") === "'-SAVE" &&
    csvCell(-5) === "-5" && csvCell("a,\"b\"") === "\"a,\"\"b\"\"\"");
  ok("a cancelled order earns nothing", lines.some((l) => l.includes(",cancelled,") && l.includes(",900,0,0,")));
  r = await call("GET", "/api/restaurant/reports/orders.csv", token(customer));
  ok("only sellers can export", r.status === 403, String(r.status));

  console.log("\npayout statements");
  r = await call("GET", "/api/restaurant/payouts", sellerToken);
  let weeks = r.body?.data?.weeks ?? [];
  const week = (key) => weeks.find((w) => w.weekStart === key);
  ok("the running week is open", week(thisWeek)?.status === "open" && week(thisWeek).net === 400, JSON.stringify(week(thisWeek)));
  ok("a finished week is due, by delivery time and net of restaurant discounts",
    week(lastWeek)?.status === "due" && week(lastWeek).orders === 3 && week(lastWeek).net === 500 + 900 + 600 && week(lastWeek).discounts === 100,
    JSON.stringify(week(lastWeek)));
  ok("the summary totals what is owed", r.body?.data?.summary?.dueTotal === 800 + 2000 && r.body.data.summary.dueWeeks === 2,
    JSON.stringify(r.body?.data?.summary));

  r = await call("GET", "/api/admin/payouts", adminToken);
  ok("admins see due weeks across restaurants", r.status === 200 && r.body?.data?.due?.length === 2 &&
    r.body.data.due[0].weekStart === twoWeeksAgo && r.body.data.due[0].restaurant.name === "Reports R", JSON.stringify(r.body).slice(0, 200));
  r = await call("GET", "/api/admin/payouts", sellerToken);
  ok("sellers cannot", r.status === 404);
  const pay = (body) => call("POST", "/api/admin/payouts", adminToken, { restaurantId: String(restaurant._id), reference: "TX-1", ...body });
  r = await pay({ weekStart: lastWeek, reference: " " });
  ok("a transfer reference is required", r.body?.code === "PAYOUT_REFERENCE", r.body?.code);
  r = await pay({ weekStart: addDays(lastWeek, 1) });
  ok("a week starts on Monday", r.body?.code === "PAYOUT_INVALID_WEEK", r.body?.code);
  r = await pay({ weekStart: thisWeek });
  ok("the running week cannot be paid", r.status === 409 && r.body?.code === "PAYOUT_WEEK_OPEN", r.body?.code);
  r = await pay({ weekStart: addDays(thisWeek, -70) });
  ok("an empty week cannot be paid", r.body?.code === "PAYOUT_NOTHING_DUE", r.body?.code);
  r = await pay({ weekStart: lastWeek });
  const payoutId = r.body?.data?.id;
  ok("an admin records a payout with the statement's amounts", r.status === 201 && r.body?.data?.net === 2000 && r.body.data.orders === 3,
    JSON.stringify(r.body).slice(0, 200));
  r = await pay({ weekStart: lastWeek });
  ok("paying twice is refused", r.status === 409 && r.body?.code === "PAYOUT_ALREADY_PAID", r.body?.code);
  ok("the payment is audited", (await AuditLog.countDocuments({ targetType: "payout", action: "payout.paid" })) === 1);

  r = await call("GET", "/api/restaurant/payouts", sellerToken);
  weeks = r.body?.data?.weeks ?? [];
  ok("the seller sees it paid with the reference", week(lastWeek)?.status === "paid" && week(lastWeek).payout?.reference === "TX-1" &&
    r.body.data.summary.dueTotal === 800 && r.body.data.summary.lastPaid?.weekStart === lastWeek, JSON.stringify(r.body?.data?.summary));
  r = await call("GET", "/api/admin/payouts", adminToken);
  ok("and it leaves the admin's due list", r.body?.data?.due?.length === 1);
  r = await call("GET", "/api/admin/payouts?status=paid", adminToken);
  ok("the paid list shows it", r.body?.data?.payouts?.[0]?.reference === "TX-1" && r.body.data.payouts[0].restaurant.name === "Reports R");
  r = await call("POST", `/api/admin/payouts/${payoutId}/void`, adminToken, {});
  ok("voiding needs a reason", r.status === 400);
  r = await call("POST", `/api/admin/payouts/${payoutId}/void`, adminToken, { reason: "Wrong account" });
  r = await call("GET", "/api/restaurant/payouts", sellerToken);
  weeks = r.body?.data?.weeks ?? [];
  ok("a voided payout makes the week due again", week(lastWeek)?.status === "due");

  r = await call("GET", `/api/restaurant/payouts/${lastWeek}/orders.csv`, sellerToken, null, { raw: true });
  ok("a statement's orders download as CSV", r.status === 200 && r.body.trim().split("\r\n").length === 1 + 3, r.body.slice(0, 200));

  console.log("\nholiday closures");
  r = await call("PUT", "/api/restaurant/closures", sellerToken, { closures: [{ from: addDays(today, 3), to: addDays(today, 1) }] });
  ok("a reversed closure is refused", r.status === 400 && r.body?.code === "CLOSURE_INVALID", `${r.status} ${r.body?.code}`);
  r = await call("PUT", "/api/restaurant/closures", sellerToken, { closures: [{ from: today, to: addDays(today, 90) }] });
  ok("a closure over 60 days is refused", r.body?.code === "CLOSURE_TOO_LONG", r.body?.code);
  r = await call("PUT", "/api/restaurant/closures", sellerToken, {
    closures: [
      { from: addDays(today, 10), to: addDays(today, 11), reason: "Inventory" },
      { from: today, to: addDays(today, 1), reason: "  Holiday  " },
      { from: addDays(today, -10), to: addDays(today, -5) },
    ],
  });
  ok("closures are saved sorted, past ones dropped", r.status === 200 && r.body?.data?.closures?.length === 2 &&
    r.body.data.closures[0].from === today && r.body.data.closures[0].reason === "Holiday", JSON.stringify(r.body?.data));
  ok("a closure today shuts the restaurant at once", r.body?.data?.isOpenNow === false &&
    (await Restaurant.findById(restaurant._id).lean()).isOpenNow === false);
  const stored = await Restaurant.findById(restaurant._id).lean();
  const slots = deliverySlots(schedulingInputs(stored));
  ok("no pre-order slots land in the closure", slots.length > 0 &&
    slots.every((s) => ![today, addDays(today, 1)].includes(zonedDateKey(new Date(s.getTime() - 60 * 60_000), TZ))),
    `${slots.length} ${slots[0]?.toISOString()}`);
  r = await call("GET", `/api/restaurants/${restaurant._id}`, sellerToken);
  ok("the public restaurant carries its closures", JSON.stringify(r.body).includes("Holiday"));
  r = await call("PUT", "/api/restaurant/closures", sellerToken, { closures: [] });
  ok("clearing them reopens it", r.body?.data?.isOpenNow === true);
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
