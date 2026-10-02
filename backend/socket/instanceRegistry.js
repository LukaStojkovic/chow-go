import { randomUUID } from "crypto";
import { getRedis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const KEY = "socket:instances";
const HEARTBEAT_MS = 5_000;
const STALE_MS = 15_000;

const instanceId = randomUUID();
let timer = null;

async function beat() {
  try {
    await getRedis()?.zAdd(KEY, { score: Date.now(), value: instanceId });
  } catch (err) {
    logger.warn({ err }, "Instance heartbeat failed");
  }
}

export async function startInstanceHeartbeat() {
  if (timer) return;
  timer = setInterval(beat, HEARTBEAT_MS);
  timer.unref();
  await beat();
}

export async function stopInstanceHeartbeat() {
  clearInterval(timer);
  timer = null;
  try {
    await getRedis()?.zRem(KEY, instanceId);
  } catch {}
}

export async function countLiveInstances() {
  const redis = getRedis();
  if (!redis) return null;
  await redis.zRemRangeByScore(KEY, "-inf", Date.now() - STALE_MS);
  return redis.zCard(KEY);
}
