import cron from "node-cron";
import Restaurant from "../models/Restaurant.js";
import { isOpenAt } from "../utils/schedule.js";
import { logger } from "../utils/logger.js";
import { recoverStuckOrders } from "./orderRecovery.service.js";
import { getRedis } from "../config/redis.js";

const MINUTE_JOB_LOCK_MS = 55_000;

export async function claimMinuteJob(now = new Date()) {
  const redis = getRedis();
  if (!redis) return true;
  const minute = Math.round(now.getTime() / 60_000);
  try {
    const won = await redis.set(`cron:minute:${minute}`, String(process.pid), {
      condition: "NX",
      expiration: { type: "PX", value: MINUTE_JOB_LOCK_MS },
    });
    return won === "OK";
  } catch (err) {
    logger.warn({ err }, "Cron lock unavailable, running without it");
    return true;
  }
}

export function startCronJobs() {
  cron.schedule("* * * * *", async () => {
    if (!(await claimMinuteJob())) return;

    try {
      const activeRestaurants = await Restaurant.find({ isActive: true })
        .select("schedule isOpenNow timezone _id")
        .lean();

      const now = new Date();
      const bulkOperations = [];

      for (const restaurant of activeRestaurants) {
        // Each restaurant is evaluated in its own zone rather than the host's.
        const shouldBeOpen = isOpenAt(restaurant.schedule, now, restaurant.timezone);

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
        logger.debug(
          `Cron: Updated isOpenNow for ${bulkOperations.length} restaurants`,
        );
      }
    } catch (error) {
      logger.error({ err: error }, "Cron job error");
    }

    try {
      await recoverStuckOrders();
    } catch (error) {
      logger.error({ err: error }, "Stuck-order recovery failed");
    }
  });

  logger.debug("⏱️  Cron jobs initialized");
}
