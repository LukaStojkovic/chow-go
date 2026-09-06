import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
const API = "http://localhost:8000/api";
let passed = 0,
  failed = 0;
const ok = (l, c, d = "") => {
  c ? passed++ : failed++;
  console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${d && !c ? ` - ${d}` : ""}`);
};
await mongoose.connect(process.env.MONGODB_URL);
const User = (await import("../models/User.js")).default;
const Restaurant = (await import("../models/Restaurant.js")).default;
const seller = await User.findOne({
  email: /^smoke-seller-.*@smoke\.test$/,
}).lean();
const customer = await User.findOne({
  email: /^smoke-customer-.*@smoke\.test$/,
}).lean();
const r = await Restaurant.findOne({ ownerId: seller._id }).lean();
const login = async (e) =>
  (
    await (
      await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client": "mobile" },
        body: JSON.stringify({ email: e, password: "smoketest123" }),
      })
    ).json()
  ).token;
const token = await login(seller.email),
  other = await login(customer.email);
const get = async (p, t) => {
  const res = await fetch(`${API}${p}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

console.log("\nstats (dashboard)");
const s = await get(`/restaurants/${r._id}/stats`, token);
ok(
  "payload sits at the top level, not under data",
  s.body.stats !== undefined && s.body.data === undefined,
  JSON.stringify(Object.keys(s.body)),
);
for (const key of ["totalRevenue", "activeOrders", "totalCustomers"]) {
  ok(
    `stats.${key} has value/trend/isPositive`,
    s.body.stats?.[key]?.value !== undefined &&
      "trend" in (s.body.stats?.[key] ?? {}),
    JSON.stringify(s.body.stats?.[key]),
  );
}
ok(
  "chartData is seven days",
  Array.isArray(s.body.chartData) && s.body.chartData.length === 7,
  String(s.body.chartData?.length),
);
ok(
  "chart entries carry date and revenue",
  "date" in (s.body.chartData?.[0] ?? {}) &&
    "revenue" in (s.body.chartData?.[0] ?? {}),
);
ok(
  "popularItems carry the fields the row renders",
  (s.body.popularItems ?? []).every(
    (i) =>
      i.name !== undefined &&
      i.totalOrders !== undefined &&
      i.totalRevenue !== undefined,
  ),
);
ok(
  "recentOrders is an array the adapter can take",
  Array.isArray(s.body.recentOrders),
);

console.log("\nanalytics");
const a = await get(`/restaurants/${r._id}/analytics`, token);
ok(
  "payload is under data",
  Boolean(a.body.data?.kpis),
  JSON.stringify(Object.keys(a.body)),
);
const d = a.body.data ?? {};
for (const key of [
  "todayRevenue",
  "todayOrders",
  "avgOrderValue",
  "monthlyRevenue",
  "averageRating",
  "totalReviews",
]) {
  ok(
    `kpis.${key} is a number`,
    typeof d.kpis?.[key] === "number",
    `${typeof d.kpis?.[key]}`,
  );
}
ok(
  "peakHours covers 24 hours",
  Array.isArray(d.peakHours) && d.peakHours.length === 24,
  String(d.peakHours?.length),
);
ok(
  "dailyRevenue is seven days",
  Array.isArray(d.dailyRevenue) && d.dailyRevenue.length === 7,
  String(d.dailyRevenue?.length),
);
ok(
  "status breakdown uses _id/count",
  (d.orderStatusBreakdown ?? []).every((e) => "_id" in e && "count" in e),
);
ok(
  "payment split uses _id/count",
  (d.paymentMethodSplit ?? []).every((e) => "_id" in e && "count" in e),
);
ok(
  "topItems carry name and totals",
  (d.topItems ?? []).every(
    (e) => e.name !== undefined && e.totalQuantity !== undefined,
  ),
);
ok("recentRatings is an array", Array.isArray(d.recentRatings));

console.log("\nownership");
ok(
  "a customer cannot read stats",
  (await get(`/restaurants/${r._id}/stats`, other)).status >= 400,
);
ok(
  "a customer cannot read analytics",
  (await get(`/restaurants/${r._id}/analytics`, other)).status >= 400,
);

await mongoose.disconnect();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
