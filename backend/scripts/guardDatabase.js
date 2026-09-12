// These scripts create real users, restaurants, menu items and orders, and only
// clean up the ids they made. Pointed at a production cluster they leave
// @smoke.test fixtures in discovery, seller dashboards and revenue stats - and
// a mid-run failure leaves them there permanently. MONGODB_URL is the same
// variable the server uses, so the default is whatever .env happens to hold.
const LOCAL_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "mongo",
  "mongodb",
  "host.docker.internal",
];

export function assertDevDatabase() {
  const url = process.env.MONGODB_URL;

  if (!url) {
    console.error("MONGODB_URL is not set.");
    process.exit(1);
  }

  if (process.env.ALLOW_NONLOCAL_DB === "1") {
    console.warn("ALLOW_NONLOCAL_DB=1 - running against a non-local database on purpose.");
    return;
  }

  // Atlas hands out comma-separated seed lists, which new URL() cannot parse,
  // so pull the host section out directly and check every host in it.
  const match = url.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/i);
  if (!match) {
    console.error("MONGODB_URL is not a recognisable connection string.");
    process.exit(1);
  }

  const hosts = match[1]
    .split(",")
    .map((h) => h.split(":")[0].toLowerCase())
    .filter(Boolean);

  const isLocal =
    hosts.length > 0 && hosts.every((h) => LOCAL_HOSTS.includes(h) || h.endsWith(".local"));
  if (isLocal) return;

  console.error(
    [
      "",
      "Refusing to run: MONGODB_URL points at a non-local host.",
      `  ${hosts.join("\n  ")}`,
      "",
      "This script writes fixtures into whatever database it is given, and only",
      "removes the ids it created - a failure part-way through leaves them behind.",
      "",
      "Point MONGODB_URL at a local or dedicated dev database, e.g.",
      "  MONGODB_URL=mongodb://127.0.0.1:27017/chowgo-dev node scripts/smokeRealtime.js",
      "",
      "If this really is a throwaway database, set ALLOW_NONLOCAL_DB=1.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
