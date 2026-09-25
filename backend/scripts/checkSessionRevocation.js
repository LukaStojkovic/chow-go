// Logout ends one device's session and its sockets; a password change or
// account deletion ends every other session and socket. Drives a real server
// on a throwaway in-memory database.
//
//   node scripts/checkSessionRevocation.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import path from "path";
import jwt from "jsonwebtoken";
import { io } from "socket.io-client";

const PORT = 8100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");
const EMAIL = `session-${Date.now()}@revoke.test`;
const PASSWORD = "originalpass1";
const NEW_PASSWORD = "brandnewpass1";
const JWT_SECRET = randomBytes(48).toString("base64url");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: {
    ...process.env,
    MONGODB_URL: mongo.getUri(),
    PORT: String(PORT),
    JWT_SECRET,
    NODE_ENV: "development",
    LOG_LEVEL: "silent",
    MAIL_DISABLED: "true",
  },
  stdio: ["ignore", "ignore", "inherit"],
});

async function call(method, p, { token, body } = {}) {
  const res = await fetch(BASE + p, {
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

const check = async (token) => (await call("GET", "/api/auth/check", { token })).status;

function openSocket(token) {
  return new Promise((resolve) => {
    const socket = io(BASE, { auth: { token }, transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => resolve({ socket, connected: false, error: "timeout" }), 5000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve({ socket, connected: true });
    });
    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      resolve({ socket, connected: false, error: err.message });
    });
  });
}

const waitForDisconnect = (socket, ms = 3000) =>
  new Promise((resolve) => {
    if (!socket.connected) return resolve(true);
    const timer = setTimeout(() => resolve(false), ms);
    socket.once("disconnect", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });

const sockets = [];

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const reg = await call("POST", "/api/auth/register", {
    body: { email: EMAIL, name: "Session", password: PASSWORD, role: "customer", phoneNumber: "0600000000" },
  });
  const phone = reg.body?.token;
  const laptop = (await call("POST", "/api/auth/login", { body: { email: EMAIL, password: PASSWORD } })).body?.token;
  ok("two devices are signed in", Boolean(phone) && Boolean(laptop));
  ok("each token carries its own jti", jwt.decode(phone)?.jti && jwt.decode(phone).jti !== jwt.decode(laptop)?.jti);

  const phoneSocket = await openSocket(phone);
  const laptopSocket = await openSocket(laptop);
  sockets.push(phoneSocket.socket, laptopSocket.socket);
  ok("both devices open a socket", phoneSocket.connected && laptopSocket.connected, phoneSocket.error ?? laptopSocket.error);

  console.log("\nlogout ends only this device");
  const out = await call("POST", "/api/auth/logout", { token: phone });
  ok("logout succeeds", out.status === 200, String(out.status));
  ok("the logged-out token is refused", (await check(phone)) === 401);
  const refused = await call("GET", "/api/auth/check", { token: phone });
  ok("with TOKEN_REVOKED", refused.body.code === "TOKEN_REVOKED", refused.body.code);
  ok("its socket is disconnected", await waitForDisconnect(phoneSocket.socket));
  ok("the other device still works", (await check(laptop)) === 200);
  ok("and its socket stays open", laptopSocket.socket.connected);
  const reopen = await openSocket(phone);
  sockets.push(reopen.socket);
  ok("a new socket with the logged-out token is refused", !reopen.connected, reopen.error);

  console.log("\nlogout never fails");
  ok("with no token", (await call("POST", "/api/auth/logout")).status === 200);
  ok("with a garbage token", (await call("POST", "/api/auth/logout", { token: "garbage" })).status === 200);
  ok("twice with the same token", (await call("POST", "/api/auth/logout", { token: phone })).status === 200);

  console.log("\ntokens minted before jti existed");
  const user = (await call("GET", "/api/auth/check", { token: laptop })).body;
  const legacy = jwt.sign({ userId: user._id, typ: "access", ver: 0 }, JWT_SECRET, { expiresIn: "1h" });
  ok("still work", (await check(legacy)) === 200);

  console.log("\npassword change ends every other session");
  const tablet = (await call("POST", "/api/auth/login", { body: { email: EMAIL, password: PASSWORD } })).body?.token;
  const tabletSocket = await openSocket(tablet);
  sockets.push(tabletSocket.socket);
  const changed = await call("PUT", "/api/auth/update-profile", {
    token: laptop,
    body: { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
  });
  ok("the change succeeds", changed.status === 200, `${changed.status} ${changed.body.message}`);
  const fresh = changed.body?.token;
  ok("the device that changed it gets a fresh token", Boolean(fresh) && fresh !== laptop);
  ok("which works", (await check(fresh)) === 200);
  ok("the old token on that device is refused", (await check(laptop)) === 401);
  ok("another device's token is refused", (await check(tablet)) === 401);
  ok("another device's socket is disconnected", await waitForDisconnect(tabletSocket.socket));
  ok("this device keeps its socket", laptopSocket.socket.connected);
  ok("the legacy token is refused too", (await check(legacy)) === 401);
  const other = await call("PUT", "/api/auth/update-profile", { token: fresh, body: { name: "Renamed" } });
  ok("a plain profile edit issues no token", other.status === 200 && other.body.token === undefined);

  console.log("\naccount deletion ends the last socket");
  const lastSocket = await openSocket(fresh);
  sockets.push(lastSocket.socket);
  ok("a socket opens with the fresh token", lastSocket.connected, lastSocket.error);
  const deleted = await call("DELETE", "/api/auth/account", { token: fresh, body: { password: NEW_PASSWORD } });
  ok("deletion succeeds", deleted.status === 200, `${deleted.status} ${deleted.body.message}`);
  ok("its socket is disconnected", await waitForDisconnect(lastSocket.socket));
} finally {
  for (const s of sockets) s?.close();
  child.kill();
  await mongo.stop();
}

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
