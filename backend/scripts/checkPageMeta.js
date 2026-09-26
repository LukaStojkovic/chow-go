// Link previews for /restaurant/:id: the served HTML names the restaurant,
// escapes whatever the seller typed, and falls back to the plain page for
// anything it cannot find. Runs against a throwaway in-memory database.
//
//   node scripts/checkPageMeta.js
import "../config/env.js";
import fs from "fs";
import os from "os";
import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongo = await MongoMemoryServer.create();
process.env.LOG_LEVEL = "silent";
process.env.FRONTEND_URL = "https://chowgo.test";
await mongoose.connect(mongo.getUri());

const { default: Restaurant } = await import("../models/Restaurant.js");
const { restaurantPreviewPage } = await import("../services/pageMeta.service.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const indexPath = path.join(os.tmpdir(), `chowgo-index-${Date.now()}.html`);
fs.writeFileSync(
  indexPath,
  fs.readFileSync(path.join(import.meta.dirname, "../../frontend/index.html"), "utf8"),
);

function serve(restaurantId) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      set(k, v) { this.headers[k] = v; return this; },
      type() { return this; },
      send(body) { resolve({ body }); },
      sendFile(file) { resolve({ file }); },
    };
    restaurantPreviewPage(indexPath)({ params: { restaurantId }, protocol: "https", get: () => "x" }, res);
  });
}

try {
  const base = {
    cuisineType: "pizza", phone: "0600000000",
    profilePicture: "https://res.cloudinary.com/demo/image/upload/v1/logo.jpg",
    images: ["https://res.cloudinary.com/demo/image/upload/v1/hero.jpg"],
    address: { street: "S", city: "C", zipCode: "11000", country: "Serbia" },
    location: { type: "Point", coordinates: [20.45, 44.8] },
  };
  const live = await Restaurant.create({
    ...base, ownerId: new mongoose.Types.ObjectId(), name: `Kafana "Pod" <Lipom>`, email: "l@meta.test",
    description: "Roštilj & domaća kuhinja since 1972", isActive: true,
  });
  const hidden = await Restaurant.create({ ...base, ownerId: new mongoose.Types.ObjectId(), name: "Hidden", email: "h@meta.test", description: "x", isActive: false });

  const { body } = await serve(String(live._id));
  ok("the title names the restaurant", body?.includes(`<title>Kafana &quot;Pod&quot; &lt;Lipom&gt; - Chow &amp; Go</title>`), body?.match(/<title>.*<\/title>/)?.[0]);
  ok("og:title is set once", (body.match(/property="og:title"/g) ?? []).length === 1);
  ok("the description is the seller's, escaped", body.includes(`content="Roštilj &amp; domaća kuhinja since 1972"`));
  ok("markup in a name cannot break out", !body.includes("<Lipom>"));
  ok("the image is a 1200x630 Cloudinary crop", body.includes("c_fill,w_1200,h_630,g_auto/v1/hero.jpg"));
  ok("the card is the large one", body.includes(`name="twitter:card" content="summary_large_image"`));
  ok("og:url is the canonical page", body.includes(`content="https://chowgo.test/restaurant/${live._id}"`));
  ok("the app still boots from it", body.includes(`id="root"`));

  ok("an inactive restaurant gets the plain page", (await serve(String(hidden._id))).file === indexPath);
  ok("an unknown id gets the plain page", (await serve(String(new mongoose.Types.ObjectId()))).file === indexPath);
  ok("a malformed id gets the plain page", (await serve("not-an-id")).file === indexPath);

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  fs.rmSync(indexPath, { force: true });
  await mongoose.disconnect();
  await mongo.stop();
}
