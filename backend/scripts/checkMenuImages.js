// A seller must never be able to delete another restaurant's images from the
// shared Cloudinary account. Runs against a throwaway in-memory database with
// Cloudinary's destroy stubbed out, so nothing is deleted for real.
//
//   node scripts/checkMenuImages.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.CLOUDINARY_CLOUD_NAME = "chowtest";
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URL = mongo.getUri();

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const img = (id) => `https://res.cloudinary.com/chowtest/image/upload/v1700000000/menu/${id}.jpg`;

try {
  await mongoose.connect(process.env.MONGODB_URL);
  const cloudinary = (await import("../utils/cloudinary.js")).default;
  const destroyed = [];
  cloudinary.uploader.destroy = async (publicId) => {
    destroyed.push(publicId);
    return { result: "ok" };
  };

  const { default: User } = await import("../models/User.js");
  const { default: Restaurant } = await import("../models/Restaurant.js");
  const { default: MenuItem } = await import("../models/MenuItem.js");
  const { updateMenuItem, deleteMenuItemById } = await import("../services/menuItem.service.js");
  const { extractCloudinaryPublicId } = await import("../utils/formatData.js");

  async function seller(tag) {
    const owner = await User.create({
      name: tag, email: `${tag}@images.test`, password: "x", role: "seller",
    });
    const restaurant = await Restaurant.create({
      ownerId: owner._id, name: tag, email: `r-${tag}@images.test`,
      phone: "0622222222", cuisineType: "pizza", description: "t",
      profilePicture: img(`${tag}-logo`),
      address: { street: "S 1", city: "C", zipCode: "11000", country: "Serbia" },
      location: { type: "Point", coordinates: [20.45, 44.8] },
    });
    return { owner, restaurant };
  }

  const a = await seller("alpha");
  const b = await seller("bravo");
  const itemA = await MenuItem.create({
    restaurant: a.restaurant._id, owner: a.owner._id, name: "A dish", description: "d", price: 9, category: "Pizza",
    imageUrls: [img("a1"), img("a2")],
  });
  const itemB = await MenuItem.create({
    restaurant: b.restaurant._id, owner: b.owner._id, name: "B dish", description: "d", price: 9, category: "Pizza",
    imageUrls: [img("b1")],
  });

  const update = (existingImages) =>
    updateMenuItem({
      restaurantId: a.restaurant._id, menuItemId: itemA._id, userId: a.owner._id,
      name: "A dish", description: "d", price: "9", category: "Pizza", available: "true",
      existingImages, newFiles: [],
    });

  console.log("\nadopting another restaurant's image");
  {
    const updated = await update([img("a1"), img("a2"), img("b1")]);
    ok("the foreign URL is dropped", !updated.imageUrls.includes(img("b1")), updated.imageUrls.join());
    ok("the seller's own images are kept", updated.imageUrls.length === 2);
    ok("nothing is destroyed", destroyed.length === 0, destroyed.join());
  }
  {
    const updated = await update([img("a1"), "https://evil.test/x.png?res.cloudinary.com"]);
    ok("a lookalike URL is dropped", updated.imageUrls.join() === img("a1"), updated.imageUrls.join());
    ok("removing its own image destroys only that one", destroyed.join() === "menu/a2", destroyed.join());
  }
  destroyed.length = 0;
  {
    const updated = await update(img("a1"));
    ok("a single string is accepted", updated.imageUrls.join() === img("a1"));
  }

  console.log("\ndeleting an item");
  {
    await MenuItem.updateOne(
      { _id: itemA._id },
      {
        $set: {
          imageUrls: [
            img("a1"),
            "https://evil.test/?res.cloudinary.com/chowtest/image/upload/menu/b1",
            "https://res.cloudinary.com/othercloud/image/upload/menu/b1.jpg",
          ],
        },
      },
    );
    await deleteMenuItemById({ restaurantId: a.restaurant._id, menuItemId: itemA._id, userId: a.owner._id });
    ok("only its own Cloudinary image is destroyed", destroyed.join() === "menu/a1", destroyed.join());
    ok("the other restaurant's item is untouched", (await MenuItem.findById(itemB._id)).imageUrls.join() === img("b1"));
  }

  console.log("\npublic id parsing");
  ok("a versioned URL in a folder", extractCloudinaryPublicId(img("x")) === "menu/x");
  ok(
    "an unversioned URL",
    extractCloudinaryPublicId("https://res.cloudinary.com/chowtest/image/upload/menu/y.png") === "menu/y",
  );
  ok("another host is refused", extractCloudinaryPublicId("https://evil.test/chowtest/image/upload/menu/y.png") === null);
  ok(
    "the host in a query string is refused",
    extractCloudinaryPublicId("https://evil.test/?res.cloudinary.com/chowtest/image/upload/y") === null,
  );
  ok(
    "another cloud is refused",
    extractCloudinaryPublicId("https://res.cloudinary.com/othercloud/image/upload/menu/y.png") === null,
  );
  ok("garbage is refused", extractCloudinaryPublicId("not a url") === null);
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
