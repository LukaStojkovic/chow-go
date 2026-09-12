// Verifies the Phase 0 operational surface against a throwaway in-memory
// database: health and readiness, the error envelope (a bad ObjectId must be a
// 400 and not a 500), JSON 404s for unmatched /api paths, and that every
// response carries a request id. Needs no running server - it boots its own.
//
//   node scripts/checkObservability.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import path from "path";

const PORT = 8099;
const BASE = `http://127.0.0.1:${PORT}`;
const cwd = path.resolve(import.meta.dirname, "..");

let passed = 0;
let failed = 0;

function ok(label, condition, detail = "") {
  condition ? passed++ : failed++;
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${detail && !condition ? ` - ${detail}` : ""}`);
}

const mongo = await MongoMemoryServer.create();
const child = spawn(process.execPath, ["index.js"], {
  cwd,
  env: {
    ...process.env,
    MONGODB_URL: mongo.getUri(),
    PORT: String(PORT),
    JWT_SECRET: randomBytes(48).toString("base64url"),
    NODE_ENV: "development",
    LOG_LEVEL: "silent",
  },
  stdio: ["ignore", "ignore", "inherit"],
});

async function waitForBoot() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function probe(label, path, expectStatus, expectCode) {
  const res = await fetch(BASE + path);
  const body = await res.json().catch(() => ({}));
  const statusOk = res.status === expectStatus;
  const codeOk = !expectCode || body.code === expectCode;
  const idOk = Boolean(res.headers.get("x-request-id"));
  ok(
    label,
    statusOk && codeOk && idOk,
    `${res.status} code=${body.code ?? "-"} requestId=${idOk ? "yes" : "MISSING"}`,
  );
}

try {
  if (!(await waitForBoot())) {
    console.error("server never became healthy");
    process.exitCode = 1;
  } else {
    console.log("\nobservability surface");
    await probe("liveness responds", "/healthz", 200);
    await probe("readiness reports a connected database", "/readyz", 200);
    await probe("bad ObjectId is a 400, not a 500", "/api/restaurants/not-an-objectid", 400, "INVALID_ID");
    await probe("missing document is a 404", "/api/restaurants/64b7f9a2e1c4d5a6b7c8d9e0", 404);
    await probe("unmatched /api path is a JSON 404", "/api/does-not-exist", 404);
    await probe("anonymous request is refused with a code", "/api/orders/000000000000000000000000", 401, "NO_TOKEN");
    await probe("socket stats require a session", "/api/socket/stats", 401, "NO_TOKEN");

    console.log(`\n  ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  }
} finally {
  child.kill();
  await mongo.stop();
}
