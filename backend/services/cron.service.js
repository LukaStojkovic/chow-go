import cron from "node-cron";
import Restaurant from "../models/Restaurant.js";

function isRestaurantOpen(openingTime, closingTime) {
  if (!openingTime || !closingTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (closeMins > openMins) {
    return currentMinutes >= openMins && currentMinutes < closeMins;
  } else if (closeMins < openMins) {
    return currentMinutes >= openMins || currentMinutes < closeMins;
  } else {
    return true;
  }
}

export function startCronJobs() {
  cron.schedule("* * * * *", async () => {
    try {
      const activeRestaurants = await Restaurant.find({ isActive: true })
        .select("openingTime closingTime isOpenNow _id")
        .lean();

      const bulkOperations = [];

      for (const restaurant of activeRestaurants) {
        const shouldBeOpen = isRestaurantOpen(
          restaurant.openingTime,
          restaurant.closingTime,
        );

        if (restaurant.isOpenNow !== shouldBeOpen) {
          bulkOperations.push({
            updateOne: {
              filter: { _id: restaurant._id },
              update: { $set: { isOpenNow: shouldBeOpen } },
            },
          });
        }
      }

      if (bulkOperations.length > 0) {
        await Restaurant.bulkWrite(bulkOperations);
        console.log(
          `Cron: Updated isOpenNow for ${bulkOperations.length} restaurants`,
        );
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });

  console.log("⏱️  Cron jobs initialized");
}
