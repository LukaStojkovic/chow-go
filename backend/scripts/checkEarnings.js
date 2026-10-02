// Who is credited with what. A restaurant earns the subtotal of delivered
// orders - not fees, not the tip, not orders still in flight; a courier earns
// the delivery fee, priority fee and tip; and days and hours are the
// restaurant's (or the platform's) local ones, not the host's. Runs against a
// throwaway in-memory database.
//
//   node scripts/checkEarnings.js
import "../config/env.js";
import { execFileSync } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri("earnings");
process.env.LOG_LEVEL = "silent";
await mongoose.connect(process.env.MONGODB_URL);

const { default: Order } = await import("../models/Order.js");
const { default: User } = await import("../models/User.js");
const { default: Courier } = await import("../models/Courier.js");
const { default: Restaurant } = await import("../models/Restaurant.js");
await import("../models/MenuItem.js");
const { getRestaurantStats } = await import("../services/stats.service.js");
const { getRestaurantAnalytics } = await import("../services/analytics.service.js");
const { getCourierAnalytics, markDeliveredOperation } = await import(
  "../services/courierOrder.service.js"
);
const { dateKey, startOfDay, startOfMonth } = await import("../utils/zonedTime.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const TZ = "Europe/Belgrade";
const MINUTE = 60 * 1000;

try {
  await Order.init();
  const owner = await User.create({ name: "O", email: "o@earn.test", password: "x", role: "seller" });
  const customer = await User.create({
    name: "C", email: "c@earn.test", password: "x", role: "customer", phoneNumber: "0600000000",
  });
  const courierUser = await User.create({
    name: "K", email: "k@earn.test", password: "x", role: "courier", phoneNumber: "0611111111",
  });
  const courier = await Courier.create({
    userId: courierUser._id, fullName: "K", phoneNumber: "0611111111", email: "k@earn.test",
    vehicleType: "bike", isAvailable: false,
  });
  const restaurant = await Restaurant.create({
    ownerId: owner._id, name: "Earn", email: "r@earn.test", phone: "0622222222",
    cuisineType: "pizza", description: "t", timezone: TZ,
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S 1", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });

  const now = new Date();
  const todayStart = startOfDay(now, TZ);
  const early = new Date(todayStart.getTime() + MINUTE);
  const lateYesterday = new Date(todayStart.getTime() - MINUTE);

  const base = {
    customer: customer._id,
    restaurant: restaurant._id,
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: "Pizza", price: 10, quantity: 1 }],
    deliveryAddress: new mongoose.Types.ObjectId(),
    deliveryAddressSnapshot: { fullAddress: "A", location: { type: "Point", coordinates: [20.46, 44.81] } },
    tax: 0,
    paymentMethod: "cash",
  };
  const place = async (fields, at, deliveredAt = at) => {
    const order = await Order.create({ ...base, ...fields });
    await Order.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: at, ...(fields.status === "delivered" ? { deliveredAt } : {}) } },
    );
    return order;
  };

  // Just after local midnight: a UTC host files this under yesterday.
  await place({
    status: "delivered", courier: courier._id,
    subtotal: 20, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 1.99, tip: 3, total: 28.99,
  }, early, new Date(early.getTime() + 30 * MINUTE));
  await place({
    status: "delivered", courier: courier._id,
    subtotal: 10, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 0, tip: 0, total: 14,
  }, lateYesterday);
  await place({ status: "preparing", subtotal: 50, deliveryFee: 2.5, serviceFee: 1.5, total: 54 }, early);
  await place({ status: "cancelled", subtotal: 100, deliveryFee: 2.5, serviceFee: 1.5, total: 104 }, early);
  const otherCustomer = await User.create({
    name: "C2", email: "c2@earn.test", password: "x", role: "customer", phoneNumber: "0633333333",
  });
  const DAY = 24 * 60 * MINUTE;
  await place({
    customer: otherCustomer._id, status: "delivered",
    subtotal: 15, deliveryFee: 2.5, serviceFee: 1.5, total: 19,
  }, new Date(todayStart.getTime() - 45 * DAY + 12 * 60 * MINUTE));
  await place(
    { status: "preparing", subtotal: 5, deliveryFee: 2.5, serviceFee: 1.5, total: 9 },
    new Date(todayStart.getTime() - 10 * DAY + 12 * 60 * MINUTE),
  );

  console.log("\nseller dashboard");
  const stats = await getRestaurantStats(String(restaurant._id), owner._id);
  ok("30-day revenue is the subtotal of delivered orders", stats.stats.totalRevenue.value === "30.00", stats.stats.totalRevenue.value);
  ok("revenue trend compares with the 30 days before", stats.stats.totalRevenue.trend === "100.0", stats.stats.totalRevenue.trend);
  ok("customers count distinct people this month", stats.stats.totalCustomers.value === 1, stats.stats.totalCustomers.value);
  ok("customer trend against last month", stats.stats.totalCustomers.trend === "0.0", stats.stats.totalCustomers.trend);
  ok("active orders include every unfinished one", stats.stats.activeOrders.value === 2, stats.stats.activeOrders.value);
  ok("order trend against last week's still-active orders", stats.stats.activeOrders.trend === "100.0", stats.stats.activeOrders.trend);
  const todayKey = dateKey(now, TZ);
  const yesterdayKey = dateKey(lateYesterday, TZ);
  const chartDay = (key) => stats.chartData.find((d) => d.date === key);
  ok("the chart ends on the restaurant's today", stats.chartData.at(-1)?.date === todayKey, stats.chartData.at(-1)?.date);
  ok("an order just after local midnight counts today", chartDay(todayKey)?.revenue === 20, JSON.stringify(chartDay(todayKey)));
  ok("in-flight orders still count as orders", chartDay(todayKey)?.orders === 2);
  ok("one just before midnight counts yesterday", chartDay(yesterdayKey)?.revenue === 10, JSON.stringify(chartDay(yesterdayKey)));

  console.log("\nseller analytics");
  const analytics = await getRestaurantAnalytics(String(restaurant._id), owner._id);
  ok("today's revenue excludes fees and tip", analytics.kpis.todayRevenue === 20, analytics.kpis.todayRevenue);
  ok("today's orders count only delivered ones", analytics.kpis.todayOrders === 1);
  ok("average order value is the food", analytics.kpis.avgOrderValue === 20);
  ok("monthly revenue is 30", analytics.kpis.monthlyRevenue === 30, analytics.kpis.monthlyRevenue);
  ok("the daily series ends on today with 20", analytics.dailyRevenue.at(-1)?.revenue === 20);
  const hour = (h) => analytics.peakHours.find((p) => p.hour === `${h}:00`);
  ok("peak hours use local hours and skip cancelled orders", hour(0)?.revenue === 20 && hour(0)?.orders === 2, JSON.stringify(hour(0)));
  ok("23:59 local is hour 23", hour(23)?.revenue === 10, JSON.stringify(hour(23)));

  console.log("\ncourier");
  const courierStats = await getCourierAnalytics({ courierUserId: courierUser._id });
  ok("today's earnings include priority fee and tip", courierStats.today.earnings === 7.49, courierStats.today.earnings);
  const expectedMonth = lateYesterday >= startOfMonth(now, TZ) ? 9.99 : 7.49;
  ok("month adds the earlier delivery", courierStats.month.earnings === expectedMonth, courierStats.month.earnings);
  ok("recent orders carry what the courier earned", courierStats.recentOrders[0]?.earnings === 7.49);

  const inTransit = await Order.create({
    ...base, status: "in_transit", courier: courier._id,
    subtotal: 12, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 1.99, tip: 2, total: 19.99,
  });
  await markDeliveredOperation({ orderId: inTransit._id, courierUserId: courierUser._id });
  ok(
    "delivering adds to the all-time counter",
    (await Courier.findById(courier._id).lean()).totalEarnings === 6.49,
  );

  console.log("\nbackfill");
  const env = { ...process.env, MONGODB_URL: process.env.MONGODB_URL };
  execFileSync("node", ["scripts/backfillCourierEarnings.js"], { env, stdio: "pipe" });
  ok(
    "the backfill sets the counter from every delivered order",
    (await Courier.findById(courier._id).lean()).totalEarnings === 16.48,
    String((await Courier.findById(courier._id).lean()).totalEarnings),
  );
  const again = execFileSync("node", ["scripts/backfillCourierEarnings.js", "--dry-run"], { env }).toString();
  ok("and running it again changes nothing", again.includes("0 to update"), again);

  console.log("\npromo codes come out of whoever issued them");
  const { restaurantEarningsOf, platformEarningsOf, courierEarningsOf: courierShare } = await import("../utils/earnings.js");
  const shopOwner = await User.create({ name: "P", email: "p@earn.test", password: "x", role: "seller" });
  const shop = await Restaurant.create({
    ownerId: shopOwner._id, name: "Promo", email: "promo@earn.test", phone: "0622222223",
    cuisineType: "pizza", description: "t", timezone: TZ,
    profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "S 2", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  });
  const sellerFunded = {
    restaurant: shop._id, status: "delivered",
    subtotal: 20, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 0, tip: 0, discount: 5, total: 19,
    promo: { code: "SHOP5", type: "fixed", fundedBy: "restaurant" },
  };
  const platformFunded = {
    restaurant: shop._id, status: "delivered",
    subtotal: 10, deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 0, tip: 0, discount: 2.5, total: 11.5,
    promo: { code: "FREEDEL", type: "free_delivery", fundedBy: "platform" },
  };
  await place(sellerFunded, early);
  await place(platformFunded, early);
  ok("a restaurant code reduces the restaurant's share", restaurantEarningsOf(sellerFunded) === 15);
  ok("a platform code leaves it alone", restaurantEarningsOf(platformFunded) === 10);
  ok("a platform code comes out of the service fee", platformEarningsOf(platformFunded) === -1);
  ok("the courier's share never moves", courierShare(sellerFunded) === 2.5 && courierShare(platformFunded) === 2.5);
  const shopAnalytics = await getRestaurantAnalytics(String(shop._id), shopOwner._id);
  ok("seller analytics report net food revenue", shopAnalytics.kpis.todayRevenue === 25, shopAnalytics.kpis.todayRevenue);
  const shopStats = await getRestaurantStats(String(shop._id), shopOwner._id);
  ok("and so does the dashboard", shopStats.stats.totalRevenue.value === "25.00", shopStats.stats.totalRevenue.value);

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
