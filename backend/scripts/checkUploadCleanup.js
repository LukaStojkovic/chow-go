// Files reach Cloudinary before the handler validates anything, so a request
// that fails must take its uploads with it. Runs the real cleanup middleware and
// the real signup handlers on an in-memory database, with multer replaced by a
// fake that fills req.files and Cloudinary's destroy stubbed out.
//
//   node scripts/checkUploadCleanup.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.CLOUDINARY_CLOUD_NAME = "chowtest";
process.env.LOG_LEVEL = "silent";
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const img = (id) => `https://res.cloudinary.com/chowtest/image/upload/v1/users/${id}.jpg`;
const settle = () => new Promise((r) => setTimeout(r, 150));

let server;
try {
  await mongoose.connect(process.env.MONGODB_URL);
  const cloudinary = (await import("../utils/cloudinary.js")).default;
  const destroyed = [];
  cloudinary.uploader.destroy = async (publicId) => {
    destroyed.push(publicId);
    return { result: "ok" };
  };

  const express = (await import("express")).default;
  const { cleanupUploadsOnFailure, createUpload } = await import("../middlewares/upload.js");
  const { register } = await import("../controllers/authController.js");
  const { handleError } = await import("../controllers/errorController.js");
  const { default: User } = await import("../models/User.js");

  console.log("\nevery upload route gets the cleanup");
  const upload = createUpload("users");
  for (const [label, chain] of [
    ["single", upload.single("profilePicture")],
    ["array", upload.array("images", 6)],
    ["fields", upload.fields([{ name: "profilePicture", maxCount: 1 }])],
  ]) {
    ok(`${label}() puts the cleanup ahead of multer`, Array.isArray(chain) && chain[0] === cleanupUploadsOnFailure);
  }

  const fakeFiles = (files) => (req, _res, next) => {
    req.files = files;
    next();
  };
  const app = express();
  app.use(express.json());
  app.post("/register", cleanupUploadsOnFailure, (req, res, next) => fakeFiles(req.body.__files)(req, res, next), register);
  app.post("/single-ok", cleanupUploadsOnFailure, (req, _res, next) => {
    req.file = { path: img("kept") };
    next();
  }, (_req, res) => res.status(200).json({ ok: true }));
  app.post("/single-crash", cleanupUploadsOnFailure, (req, _res, next) => {
    req.file = { path: img("crashed") };
    next();
  }, () => {
    throw new Error("boom");
  });
  app.use(handleError);
  server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (p, body) => {
    const res = await fetch(base + p, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return res.status;
  };

  await User.create({
    email: "taken@upload.test", name: "Taken", password: "x", role: "customer", phoneNumber: "0600000000",
  });

  console.log("\nfailed signups take their uploads with them");
  destroyed.length = 0;
  const dup = await post("/register", {
    email: "taken@upload.test", name: "Dup", password: "longenough1", role: "customer", phoneNumber: "0600000001",
    __files: { profilePicture: [{ path: img("dup-avatar") }] },
  });
  await settle();
  ok("a duplicate email is refused", dup === 400, String(dup));
  ok("and its profile picture is deleted", destroyed.join() === "users/dup-avatar", destroyed.join());

  destroyed.length = 0;
  const seller = await post("/register", {
    email: "seller@upload.test", name: "Seller", password: "longenough1", role: "seller",
    __files: {
      profilePicture: [{ path: img("s-avatar") }],
      restaurantImages: [{ path: img("s-1") }, { path: img("s-2") }],
    },
  });
  await settle();
  ok("a seller missing restaurant fields is refused", seller === 400, String(seller));
  ok(
    "and all three of its images are deleted",
    ["users/s-avatar", "users/s-1", "users/s-2"].every((id) => destroyed.includes(id)) && destroyed.length === 3,
    destroyed.join(),
  );

  destroyed.length = 0;
  const customer = await post("/register", {
    email: "customer@upload.test", name: "Customer", password: "longenough1", role: "customer", phoneNumber: "0600000002",
    __files: { restaurantImages: [{ path: img("stray") }] },
  });
  await settle();
  ok("a customer sending restaurant images is refused", customer === 400, String(customer));
  ok("and the stray image is deleted", destroyed.join() === "users/stray", destroyed.join());
  ok("and no account was created", !(await User.exists({ email: "customer@upload.test" })));

  console.log("\nsuccessful requests keep their uploads");
  destroyed.length = 0;
  const good = await post("/register", {
    email: "fine@upload.test", name: "Fine", password: "longenough1", role: "customer", phoneNumber: "0600000003",
    __files: { profilePicture: [{ path: img("fine-avatar") }] },
  });
  await settle();
  ok("a valid signup succeeds", good === 201, String(good));
  ok("and nothing is deleted", destroyed.length === 0, destroyed.join());
  ok("a successful single upload is kept", (await post("/single-ok")) === 200 && (await settle(), destroyed.length === 0));

  console.log("\na crash cleans up too");
  destroyed.length = 0;
  const crash = await post("/single-crash");
  await settle();
  ok("a handler that throws returns 500", crash === 500, String(crash));
  ok("and its upload is deleted", destroyed.join() === "users/crashed", destroyed.join());
} finally {
  server?.close();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
