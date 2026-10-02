// Two backend instances sharing one Redis behave as one: sockets, logout,
// rate limits and the cron lock all span both. Needs a reachable Redis;
// everything else (MongoDB, secrets) is throwaway.
//
//   REDIS_URL=redis://127.0.0.1:6379 node scripts/checkRedis.js
import "../config/env.js";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import path from "path";
import { io } from "socket.io-client";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.log("SKIP  REDIS_URL is not set");
  process.exit(0);
}

const { connectRedis, getRedis, getAdapterClients, closeRedis } = await import("../config/redis.js");
const { claimMinuteJob } = await import("../services/cron.service.js");
const { createSharedCache } = await import("../utils/sharedCache.js");

const cwd = path.resolve(import.meta.dirname, "..");
const JWT_SECRET = randomBytes(48).toString("base64url");
const EMAIL = `redis-${Date.now()}@redis.test`;
const PASSWORD = "redischeck1";
const basePort = 8500 + Math.floor(Math.random() * 400);
const A = `http://127.0.0.1:${basePort}`;
const B = `http://127.0.0.1:${basePort + 1}`;

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const children = [basePort, basePort + 1].map((port) =>
  spawn(process.execPath, ["index.js"], {
    cwd,
    env: {
      ...process.env,
      MONGODB_URL: mongo.getUri(),
      PORT: String(port),
      JWT_SECRET,
      REDIS_URL,
      NODE_ENV: "development",
      LOG_LEVEL: "silent",
      MAIL_DISABLED: "true",
    },
    stdio: ["ignore", "ignore", "inherit"],
  }),
);

async function call(base, method, p, { token, body } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "mobile",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

function openSocket(base, token) {
  return new Promise((resolve) => {
    const socket = io(base, { auth: { token }, transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => resolve({ socket, connected: false }), 5000);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.emit("register", { role: "customer" });
      socket.once("registered", () => resolve({ socket, connected: true }));
    });
    socket.on("connect_error", () => {
      clearTimeout(timer);
      resolve({ socket, connected: false });
    });
  });
}

const waitFor = (socket, event, ms = 3000) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload ?? true);
    });
  });

const sockets = [];
let probeServer = null;

async function clearLocalRateLimits() {
  const redis = getRedis();
  if (!redis) return;
  for await (const keys of redis.scanIterator({ MATCH: "rl:*", COUNT: 500 })) {
    const ours = keys.filter((k) => k.includes("redis.test") || k.includes("127.0.0.1") || k.endsWith("::1"));
    if (ours.length) await redis.del(ours);
  }
}

try {
  await connectRedis(REDIS_URL);
  ok("this process reaches Redis", Boolean(getRedis()));
  await clearLocalRateLimits();

  for (const base of [A, B]) {
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(`${base}/healthz`)).ok) break; } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("\nboth instances report Redis");
  for (const [name, base] of [["A", A], ["B", B]]) {
    const ready = await call(base, "GET", "/readyz");
    ok(`${name} is ready with redis connected`, ready.status === 200 && ready.body.redis === "connected", JSON.stringify(ready.body));
  }

  const reg = await call(A, "POST", "/api/auth/register", {
    body: { email: EMAIL, name: "Redis", password: PASSWORD, role: "customer", phoneNumber: "0600000000" },
  });
  const token = reg.body?.token;
  ok("a customer signs up on A", Boolean(token), String(reg.status));

  console.log("\nsockets span instances");
  const onB = await openSocket(B, token);
  sockets.push(onB.socket);
  ok("the customer's socket registers on B", onB.connected);

  let stats;
  for (let i = 0; i < 25; i++) {
    stats = await call(A, "GET", "/api/socket/stats", { token });
    if (stats.body.instances >= 2 && stats.body.customers >= 1) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  ok("A counts at least both instances", stats.body.instances >= 2, JSON.stringify(stats.body));
  ok("A sees the customer connected to B", stats.body.customers >= 1 && stats.body.totalConnections >= 1, JSON.stringify(stats.body));

  const { pub, sub } = getAdapterClients();
  probeServer = new Server();
  probeServer.adapter(createAdapter(pub, sub, { key: "chowgo:socket" }));
  const userId = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).userId;
  const probe = waitFor(onB.socket, "redis:probe");
  probeServer.to(`customer:${userId}`).emit("redis:probe", { from: "elsewhere" });
  ok("an emit from another process reaches the customer room on B", Boolean(await probe));
  probeServer.of("/").adapter.close();
  probeServer = null;

  const dropped = waitFor(onB.socket, "disconnect");
  const out = await call(A, "POST", "/api/auth/logout", { token });
  ok("logout on A succeeds", out.status === 200, String(out.status));
  ok("and disconnects the socket held by B", Boolean(await dropped));

  console.log("\nrate limits are shared");
  const victim = `limit-${EMAIL}`;
  const statuses = [];
  for (let i = 0; i < 10; i++) {
    statuses.push((await call(i % 2 ? B : A, "POST", "/api/auth/login", { body: { email: victim, password: "wrong-password" } })).status);
  }
  ok("ten failed logins split across A and B are each answered", statuses.every((s) => s !== 429), statuses.join(","));
  const eleventh = await call(A, "POST", "/api/auth/login", { body: { email: victim, password: "wrong-password" } });
  ok("the eleventh is limited, though A alone saw six", eleventh.status === 429, String(eleventh.status));

  console.log("\nthe minute job runs once");
  const minute = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
  await getRedis().del(`cron:minute:${Math.round(minute.getTime() / 60_000)}`);
  ok("the first instance claims the minute", await claimMinuteJob(minute));
  ok("the second does not", !(await claimMinuteJob(new Date(minute.getTime() + 400))));

  console.log("\ncaches are shared");
  const cacheA = createSharedCache({ name: "redis-check", ttlMs: 60_000, maxEntries: 10 });
  const cacheB = createSharedCache({ name: "redis-check", ttlMs: 60_000, maxEntries: 10 });
  await cacheA.set("k", { value: 42 });
  ok("a value written through one cache is read through another", (await cacheB.get("k"))?.value === 42);
  await cacheA.clear();
  ok("and clear removes it", (await cacheB.get("k")) === undefined);
} catch (err) {
  failed++;
  console.error(err);
} finally {
  for (const s of sockets) s.close();
  probeServer?.of("/").adapter.close();
  await clearLocalRateLimits().catch(() => {});
  await closeRedis();
  for (const child of children) child.kill();
  await mongo.stop();
}

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
