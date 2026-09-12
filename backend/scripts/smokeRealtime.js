/**
 * End-to-end realtime smoke test.
 *
 * Drives one order through the full lifecycle over HTTP while three sockets —
 * customer, seller, courier — listen, and asserts every expected event lands in
 * the right room. Realtime is the riskiest surface in the app and the one thing
 * no other check covers: a renamed event or a broken room mapping fails
 * silently, and the UI simply stops updating.
 *
 * Everything it creates is namespaced @smoke.test and removed afterwards, even
 * on failure. It talks to whatever MONGODB_URL points at, so run it against a
 * dev database.
 *
 *   node scripts/smokeRealtime.js          # needs the server already running
 *   node scripts/smokeRealtime.js --keep   # leave the fixtures behind
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { io } from "socket.io-client";

dotenv.config();

import { assertDevDatabase } from "./guardDatabase.js";
assertDevDatabase();

const BASE = `http://localhost:${process.env.PORT || 8000}`;
const API = `${BASE}/api`;
const PASSWORD = "smoketest123";
const TAG = "@smoke.test";
const KEEP = process.argv.includes("--keep");

const stamp = Date.now();
const emailFor = (role) => `smoke-${role}-${stamp}${TAG}`;

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

/** Resolves with the first matching event, or null if it never arrives. */
function waits(socket, event, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve(null);
    }, timeoutMs);
    function handler(payload) {
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    }
    socket.on(event, handler);
  });
}

function connect(token, registration) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: false,
    });
    const timer = setTimeout(() => reject(new Error("socket timeout")), 10000);
    socket.on("connect", () => socket.emit("register", registration));
    socket.on("registered", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on("registration_error", (data) => {
      clearTimeout(timer);
      reject(new Error(`registration_error: ${data.message}`));
    });
    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// The token only appears in the body for mobile clients, and every call here
// uses the bearer path, so this doubles as a check that it still works.
async function request(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `${method} ${path} -> ${response.status}: ${payload.message ?? "no message"}`,
    );
  }
  return payload;
}

/**
 * Everyone registers as a customer and is promoted afterwards. Seller signup
 * demands all 11 restaurant fields plus an image upload, and this test builds
 * the restaurant directly. Safe to do: the JWT carries only a userId, so the
 * role is resolved from the database on every request and every handshake.
 */
async function registerUser(role, User) {
  const data = await request("POST", "/auth/register", {
    body: {
      email: emailFor(role),
      name: `Smoke ${role}`,
      password: PASSWORD,
      role: "customer",
      phoneNumber: "0600000000",
    },
  });
  if (!data.token) throw new Error(`no token returned for ${role}`);

  if (role !== "customer") {
    await User.updateOne({ _id: data._id }, { role });
  }
  return { ...data, role };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);

  const User = (await import("../models/User.js")).default;
  const Restaurant = (await import("../models/Restaurant.js")).default;
  const MenuItem = (await import("../models/MenuItem.js")).default;
  const Addresses = (await import("../models/Addresses.js")).default;
  const Order = (await import("../models/Order.js")).default;
  const Courier = (await import("../models/Courier.js")).default;

  const sockets = [];

  try {
    console.log("\nfixtures");
    const customer = await registerUser("customer", User);
    const seller = await registerUser("seller", User);
    const courierUser = await registerUser("courier", User);
    console.log(`  3 users created (${TAG})`);

    // Built directly rather than through signup, which demands 11 fields and a
    // Cloudinary upload for images this test never looks at.
    const restaurant = await Restaurant.create({
      ownerId: seller._id,
      name: `Smoke Diner ${stamp}`,
      cuisineType: "burgers",
      profilePicture: "https://example.test/logo.png",
      description: "Fixture restaurant for the realtime smoke test.",
      images: ["https://example.test/cover.png"],
      address: {
        street: "Knez Mihailova 1",
        city: "Belgrade",
        zipCode: "11000",
      },
      location: { type: "Point", coordinates: [20.4633, 44.8176] },
      phone: "0600000000",
      email: `restaurant-${stamp}${TAG}`,
      isActive: true,
      isOpenNow: true,
    });

    const menuItem = await MenuItem.create({
      restaurant: restaurant._id,
      name: "Smoke Burger",
      description: "Fixture menu item.",
      price: 9.99,
      category: "Burgers",
      imageUrls: ["https://example.test/burger.png"],
      available: true,
      owner: seller._id,
    });

    await Courier.create({
      userId: courierUser._id,
      fullName: "Smoke Courier",
      phoneNumber: "0600000000",
      email: courierUser.email,
      vehicleType: "bike",
      isAvailable: true,
      // acceptOrderOperation refuses orders from an unverified courier, and
      // signup leaves this "pending".
      verificationStatus: "verified",
    });

    const address = await Addresses.create({
      userId: customer._id,
      label: "Home",
      addressType: "apartment",
      fullAddress: "Terazije 10, Belgrade",
      location: { type: "Point", coordinates: [20.4612, 44.8125] },
      isDefault: true,
    });
    console.log("  restaurant, menu item, courier profile and address created");

    console.log("\nsockets");
    const customerSocket = await connect(customer.token, { role: "customer" });
    const sellerSocket = await connect(seller.token, {
      role: "seller",
      restaurantId: String(restaurant._id),
    });
    const courierSocket = await connect(courierUser.token, { role: "courier" });
    sockets.push(customerSocket, sellerSocket, courierSocket);
    check(
      "customer, seller and courier all register over handshake.auth.token",
      true,
    );

    console.log("\nlifecycle");

    await request("POST", "/cart/items", {
      token: customer.token,
      body: { menuItemId: String(menuItem._id), quantity: 2 },
    });

    const sellerSeesNewOrder = waits(sellerSocket, "order:new");
    const created = await request("POST", "/orders/create", {
      token: customer.token,
      body: {
        restaurantId: String(restaurant._id),
        deliveryAddressId: String(address._id),
        paymentMethod: "cash",
        deliveryType: "standard",
      },
    });
    const order = created?.data?.order ?? created?.order ?? created;
    const orderId = order._id;

    const newOrderEvent = await sellerSeesNewOrder;
    check(
      "order:new reaches the restaurant room",
      Boolean(newOrderEvent?.order),
    );
    check(
      "order:new carries the order number the UI reads",
      newOrderEvent?.order?.orderNumber != null,
      `got ${JSON.stringify(newOrderEvent?.order?.orderNumber)}`,
    );

    const confirmed = waits(customerSocket, "order:confirmed");
    await request("PATCH", `/restaurant/orders/${orderId}/confirm`, {
      token: seller.token,
      body: { estimatedPreparationTime: 20 },
    });
    check(
      "order:confirmed reaches the customer room",
      Boolean((await confirmed)?.order),
    );

    const preparing = waits(customerSocket, "order:preparing");
    await request("PATCH", `/restaurant/orders/${orderId}/status`, {
      token: seller.token,
      body: { status: "preparing" },
    });
    check(
      "order:preparing reaches the customer room",
      Boolean((await preparing)?.order),
    );

    // Going ready both notifies the customer and opens the order to the pool.
    const ready = waits(customerSocket, "order:ready");
    const offered = waits(courierSocket, "order:available");
    await request("PATCH", `/restaurant/orders/${orderId}/status`, {
      token: seller.token,
      body: { status: "ready" },
    });
    check(
      "order:ready reaches the customer room",
      Boolean((await ready)?.order),
    );
    check("order:available reaches the courier pool", Boolean(await offered));

    const assignedToCustomer = waits(customerSocket, "order:assigned");
    const takenFromPool = waits(courierSocket, "order:taken");
    await request("PATCH", `/courier/${orderId}/accept`, {
      token: courierUser.token,
      body: {},
    });
    check(
      "order:assigned reaches the customer room",
      Boolean((await assignedToCustomer)?.order),
    );
    check(
      "order:taken clears the order from the pool",
      Boolean(await takenFromPool),
    );

    const pickedUp = waits(customerSocket, "order:picked_up");
    await request("PATCH", `/courier/${orderId}/picked-up`, {
      token: courierUser.token,
      body: {},
    });
    check(
      "order:picked_up reaches the customer room",
      Boolean((await pickedUp)?.order),
    );

    const inTransit = waits(customerSocket, "order:in_transit");
    await request("PATCH", `/courier/${orderId}/in-transit`, {
      token: courierUser.token,
      body: {},
    });
    check(
      "order:in_transit reaches the customer room",
      Boolean((await inTransit)?.order),
    );

    const delivered = waits(customerSocket, "order:delivered");
    await request("PATCH", `/courier/${orderId}/delivered`, {
      token: courierUser.token,
      body: {},
    });
    const deliveredEvent = await delivered;
    check(
      "order:delivered reaches the customer room",
      Boolean(deliveredEvent?.order),
    );
    check(
      "delivered payload is populated, not a bare id",
      typeof deliveredEvent?.order?.restaurant === "object",
      `restaurant was ${typeof deliveredEvent?.order?.restaurant}`,
    );
  } catch (err) {
    // Reported here rather than by the caller: the finally block exits the
    // process, so anything thrown would otherwise vanish.
    failed++;
    console.error(`
  ABORTED  ${err.message}`);
  } finally {
    sockets.forEach((socket) => socket.close());

    if (KEEP) {
      console.log(`\nfixtures kept (${TAG})`);
    } else {
      const users = await User.find({ email: new RegExp("@smoke\\.test$") })
        .select("_id")
        .lean();
      const ids = users.map((u) => u._id);
      const restaurants = await Restaurant.find({ ownerId: { $in: ids } })
        .select("_id")
        .lean();
      const restaurantIds = restaurants.map((r) => r._id);

      const Cart = (await import("../models/Cart.js")).default;
      const Notification = (await import("../models/OrderNotification.js"))
        .default;

      await Promise.all([
        Order.deleteMany({ customer: { $in: ids } }),
        MenuItem.deleteMany({ restaurant: { $in: restaurantIds } }),
        Restaurant.deleteMany({ _id: { $in: restaurantIds } }),
        Addresses.deleteMany({ userId: { $in: ids } }),
        Courier.deleteMany({ userId: { $in: ids } }),
        Cart.deleteMany({ user: { $in: ids } }),
        Notification.deleteMany({ recipient: { $in: ids } }),
        User.deleteMany({ _id: { $in: ids } }),
      ]);
      console.log("\nfixtures removed");
    }

    await mongoose.disconnect();
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  }
}

main().catch(async (err) => {
  console.error(
    "\nsmoke test aborted:",
    err.response?.data?.message || err.message,
  );
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
