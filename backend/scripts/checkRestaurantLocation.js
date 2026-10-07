// A seller moving their pin from settings, over the real multipart route the
// web and mobile autosaves use: location[lat]/location[lng] must land as
// GeoJSON [lng, lat], bad pins must be refused without touching the stored
// one, and an address-only save must leave the pin where it was.
//
//   node scripts/checkRestaurantLocation.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import path from "path";

const PORT = 9200 + Math.floor(Math.random() * 300);
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
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: "development",
    MAIL_DISABLED: "true",
    REDIS_URL: "",
  },
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
  const { generateToken } = await import("../utils/generateToken.js");

  const seller = await User.create({ name: "S", email: "s@location.test", password: "x", role: "seller" });
  await Restaurant.create({
    ownerId: seller._id, name: "R", email: "r@location.test", phone: "0622222222", cuisineType: "pizza",
    description: "t", profilePicture: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    address: { street: "Old 1", city: "Beograd", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
    isActive: true, isOpenNow: true,
  });
  const token = generateToken(seller, null, false, { skipCookie: true });
  const read = async () => (await Restaurant.findOne({ ownerId: seller._id }).lean());

  const put = async (fields) => {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.append(key, String(value));
    const res = await fetch(`${BASE}/api/restaurants/update`, {
      method: "PUT",
      headers: { "X-Client": "mobile", Authorization: `Bearer ${token}` },
      body,
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  console.log("\nmoving the pin");
  let r = await put({ "location[lat]": "44.8125", "location[lng]": "20.4612" });
  let stored = await read();
  ok("a multipart pin is accepted", r.status === 200, `${r.status} ${r.body?.code}`);
  ok("and stored as GeoJSON [lng, lat]",
    stored.location.type === "Point" && stored.location.coordinates[0] === 20.4612 && stored.location.coordinates[1] === 44.8125,
    JSON.stringify(stored.location));

  console.log("\nbad pins are refused and change nothing");
  for (const [label, fields] of [
    ["a missing longitude", { "location[lat]": "44.8" }],
    ["blank values", { "location[lat]": "", "location[lng]": "" }],
    ["text", { "location[lat]": "north", "location[lng]": "20.4" }],
    ["a latitude past the pole", { "location[lat]": "91", "location[lng]": "20.4" }],
    ["a longitude past the date line", { "location[lat]": "44.8", "location[lng]": "181" }],
    ["0,0 from a form that never got a pin", { "location[lat]": "0", "location[lng]": "0" }],
  ]) {
    r = await put(fields);
    ok(`${label} is a 400 LOCATION_INVALID`, r.status === 400 && r.body?.code === "LOCATION_INVALID", `${r.status} ${r.body?.code}`);
  }
  r = await put({ name: "Renamed", "location[lat]": "999", "location[lng]": "20" });
  stored = await read();
  ok("a refused pin does not half-apply the rest of the save", stored.name === "R", stored.name);
  ok("the stored pin is untouched", stored.location.coordinates.join() === "20.4612,44.8125", stored.location.coordinates.join());

  console.log("\nan address-only save keeps the pin");
  r = await put({ "address[street]": "New 2", "address[city]": "Novi Sad" });
  stored = await read();
  ok("the address text changed", r.status === 200 && stored.address.street === "New 2" && stored.address.city === "Novi Sad");
  ok("the pin did not move", stored.location.coordinates.join() === "20.4612,44.8125");

  console.log("\nthe restaurant shows up where the pin is");
  const nearby = async (lat, lon) =>
    JSON.stringify(
      await fetch(`${BASE}/api/location/get-near-restaurants?lat=${lat}&lon=${lon}&maxDistanceMeters=300`)
        .then((res) => res.json())
        .catch(() => ({})),
    ).includes(String(stored._id));
  ok("a search within 300 m of the new pin finds it", await nearby(44.8125, 20.4612));
  ok("a search within 300 m of the old pin no longer does", !(await nearby(44.8, 20.45)));
} finally {
  child.kill();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
