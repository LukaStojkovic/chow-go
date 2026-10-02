import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const CONNECT_TIMEOUT_MS = 10_000;

let client = null;
let adapterPub = null;
let adapterSub = null;

function watch(redisClient, name) {
  let healthy = true;
  redisClient.on("error", (err) => {
    if (!healthy) return;
    healthy = false;
    logger.error({ err, client: name }, "Redis connection lost");
  });
  redisClient.on("ready", () => {
    if (healthy) return;
    healthy = true;
    logger.info({ client: name }, "Redis reconnected");
  });
  return redisClient;
}

export async function connectRedis(url = env.redisUrl) {
  if (!url || client) return client;

  const base = createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries) => Math.min(retries * 200, 5_000),
    },
  });
  const pub = base.duplicate({ disableOfflineQueue: false });
  const sub = base.duplicate({ disableOfflineQueue: false });
  watch(base, "commands");
  watch(pub, "adapter-pub");
  watch(sub, "adapter-sub");

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Redis not reachable within ${CONNECT_TIMEOUT_MS} ms`)), CONNECT_TIMEOUT_MS).unref(),
  );
  await Promise.race([Promise.all([base.connect(), pub.connect(), sub.connect()]), timeout]);

  client = base;
  adapterPub = pub;
  adapterSub = sub;
  logger.info("Redis connected");
  return client;
}

export function getRedis() {
  return client?.isReady ? client : null;
}

export const isRedisConfigured = () => client !== null;

export const getAdapterClients = () => (client ? { pub: adapterPub, sub: adapterSub } : null);

export async function pingRedis() {
  if (!client) return "disabled";
  try {
    await client.ping();
    return "connected";
  } catch {
    return "unreachable";
  }
}

export async function closeRedis() {
  const clients = [client, adapterPub, adapterSub].filter(Boolean);
  client = adapterPub = adapterSub = null;
  await Promise.allSettled(clients.map((c) => c.close()));
}
