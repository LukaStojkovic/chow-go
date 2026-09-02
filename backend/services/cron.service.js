import cron from "node-cron";
import Restaurant from "../models/Restaurant.js";
import { isOpenAt } from "../utils/schedule.js";

export function startCronJobs() {
  cron.schedule("* * * * *", async () => {
    try {
      const activeRestaurants = await Restaurant.find({ isActive: true })
        .select("schedule isOpenNow _id")
        .lean();

      const now = new Date();
      const bulkOperations = [];

      for (const restaurant of activeRestaurants) {
        const shouldBeOpen = isOpenAt(restaurant.schedule, now);

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
