// The public geocoding proxies must not turn this server into a free, unlimited
// front for Nominatim and a paid LocationIQ key. Mounts the real router with
// the global fetch stubbed, so nothing reaches either service.
//
//   node scripts/checkGeocoding.js
process.env.LOCATION_IQ_ACCESS_KEY = "check-secret-key";
process.env.LOG_LEVEL = "silent";

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const realFetch = globalThis.fetch;
const upstream = [];
let upstreamFails = false;
globalThis.fetch = async (url, init) => {
  const target = String(url);
  if (!target.includes("nominatim") && !target.includes("locationiq")) return realFetch(url, init);
  upstream.push({ url: target, at: Date.now() });
  if (upstreamFails) throw new Error("network down");
  return new Response(JSON.stringify(target.includes("nominatim") ? { display_name: "Somewhere" } : [{ display_name: "Match" }]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const express = (await import("express")).default;
const { default: locationRouter } = await import("../routes/locationRouter.js");
const { resetLocationCaches } = await import("../controllers/locationController.js");
const { handleError } = await import("../controllers/errorController.js");

const app = express();
app.use("/api/location", locationRouter);
app.use(handleError);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/location`;

let geocodeCalls = 0;
async function get(p) {
  geocodeCalls++;
  const res = await realFetch(base + p);
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

try {
  console.log("\nreverse geocoding");
  let r = await get("/get-location?lat=44.812345&lon=20.461234");
  ok("a lookup succeeds", r.status === 200 && r.body.display_name === "Somewhere", String(r.status));
  ok("coordinates are rounded to 4 decimals upstream", upstream[0]?.url.includes("lat=44.8123&lon=20.4612"), upstream[0]?.url);
  await get("/get-location?lat=44.812349&lon=20.461231");
  ok("a lookup a few metres away is served from cache", upstream.length === 1, String(upstream.length));

  await get("/get-location?lat=44.9&lon=20.5");
  ok(
    "a second distinct lookup waits a second for Nominatim",
    upstream.length === 2 && upstream[1].at - upstream[0].at >= 950,
    `${upstream[1]?.at - upstream[0]?.at}ms`,
  );

  await resetLocationCaches();
  upstream.length = 0;
  const burst = await Promise.all(
    Array.from({ length: 8 }, (_, i) => get(`/get-location?lat=${45 + i / 10}&lon=21`)),
  );
  const busy = burst.filter((b) => b.status === 503);
  ok(
    "a burst beyond the queue is refused with LOCATION_BUSY",
    busy.length >= 1 && busy.every((b) => b.body.code === "LOCATION_BUSY"),
    burst.map((b) => b.status).join(","),
  );
  const gaps = upstream.slice(1).map((u, i) => u.at - upstream[i].at);
  ok("and what was sent stayed at one per second", gaps.every((g) => g >= 950), gaps.join(","));

  console.log("\nautocomplete");
  upstream.length = 0;
  ok("an array query is refused", (await get("/location-prediction?query=a&query=b")).status === 400);
  ok("a two-character query is refused", (await get("/location-prediction?query=ab")).status === 400);
  ok("a 101-character query is refused", (await get(`/location-prediction?query=${"x".repeat(101)}`)).status === 400);
  ok("nothing reached LocationIQ", upstream.length === 0);
  r = await get("/location-prediction?query=Knez%20Mihailova");
  ok("a valid query succeeds", r.status === 200 && r.body.data?.[0]?.display_name === "Match");
  await get("/location-prediction?query=%20knez%20%20MIHAILOVA%20");
  ok("the same query in other casing and spacing is cached", upstream.length === 1, String(upstream.length));

  console.log("\nupstream failures");
  upstreamFails = true;
  r = await get("/location-prediction?query=Terazije");
  ok("a network failure is a 502", r.status === 502 && r.body.code === "LOCATION_UPSTREAM", `${r.status} ${r.body.code}`);
  ok("and the key is not in the response", !JSON.stringify(r.body).includes("check-secret-key"));
  upstreamFails = false;

  console.log("\nrate limit");
  let firstRefusal = null;
  while (geocodeCalls < 40) {
    const res = await get("/location-prediction?query=Knez%20Mihailova");
    if (res.status === 429) {
      firstRefusal = geocodeCalls;
      break;
    }
  }
  ok("the 31st lookup in a minute is refused", firstRefusal === 31, String(firstRefusal));
} finally {
  server.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
