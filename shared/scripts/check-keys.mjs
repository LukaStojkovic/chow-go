/**
 * Fail when a client asks for a translation key the catalog does not have.
 *
 * A missing key does not throw. i18next falls back to the key itself, so the
 * screen renders "profile:address.saveAs" where a label should be - and in
 * production, with `debug` off, nothing is logged at all. The only reason the
 * Serbian cuisine bug surfaced is that someone happened to be watching a dev
 * console.
 *
 * Only fully literal keys are checked. A key built from a template literal
 * depends on runtime data, and the honest answer for those is a `defaultValue`
 * at the call site rather than a guess here - so this reports dynamic keys
 * that have no fallback separately, as a warning.
 *
 * Run: npm run check:keys  (from shared/)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { resources, SUPPORTED_LOCALES } from "../src/i18n/index.js";

const ROOT = resolve(import.meta.dirname, "..", "..");
const SCAN = ["frontend/src", "mobile/src", "mobile/app", "shared/src", "backend"];
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (["node_modules", "dist", ".expo", "locales"].includes(entry)) continue;
      out.push(...walk(full));
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every key a namespace defines, with plural families collapsed to their base.
 *
 * @param {Object} node
 * @param {string} [prefix]
 * @param {Set<string>} [out]
 * @returns {Set<string>}
 */
function keysOf(node, prefix = "", out = new Set()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keysOf(value, path, out);
    } else {
      out.add(path.replace(PLURAL_SUFFIX, ""));
      // A parent path is legitimate too: `t("a.b")` where the catalog nests
      // `a.b.label` is a bug, but `returnObjects` callers exist elsewhere.
    }
  }
  return out;
}

const catalog = new Map();
for (const [namespace, entries] of Object.entries(resources[SUPPORTED_LOCALES[0]])) {
  catalog.set(namespace, keysOf(entries));
}

// t("ns:some.key"  /  t(`ns:some.key`  — literal only, no ${...}
const LITERAL_KEY = /\bt\(\s*["'`]([a-z]+:[A-Za-z0-9_.]+)["'`]/g;
// t(`ns:prefix.${...}`  — dynamic, only reported when it has no defaultValue
const DYNAMIC_KEY = /\bt\(\s*`([a-z]+:[^`]*\$\{[^`]*)`\s*(,\s*\{[^)]*)?\)/g;

// A t() call carrying a namespace, i.e. one of ours rather than some other
// single-letter helper.
const NAMESPACED_CALL = /\bt\(\s*["'`][a-z]+:/;

// The ways a file legitimately gets one: the react-i18next hook, the shared
// package's bare export (by subpath from a client, relatively from inside the
// package), the definition itself, or a `t` parameter.
const PROVIDES_T = [
  /useTranslation\(/,
  /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*"@chowgo\/shared\/i18n"/,
  /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*"\.[^"]*i18n\/index\.js"/,
  /export function t\(/,
  /function\s+\w+\([^)]*\bt\b[^)]*\)/,
  /\([^)]*\bt\b[^)]*\)\s*=>/,
];

// The call, not a mention of it in a comment.
const USES_HOOK = /=\s*useTranslation\(/;

// useTranslation("auth")  /  useTranslation(["auth", "common"])
const DECLARED_NAMESPACES = /useTranslation\(\s*(\[[^\]]*\]|"[a-z]+"|'[a-z]+')/g;
// t("some.key"  — a bare key, resolved against whatever the file loaded.
const BARE_KEY = /\bt\(\s*["'`]([a-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)["'`]/g;

const missing = [];
const unguarded = [];
const unbound = [];

for (const file of SCAN.flatMap((dir) => walk(join(ROOT, dir)))) {
  const source = readFileSync(file, "utf8");
  const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");

  for (const [, key] of source.matchAll(LITERAL_KEY)) {
    const [namespace, path] = key.split(":");
    const known = catalog.get(namespace);

    if (!known) {
      missing.push(`${relative}\n      "${key}" - no namespace "${namespace}"`);
      continue;
    }
    if (!known.has(path)) {
      missing.push(`${relative}\n      "${key}" is not in the catalog`);
    }
  }

  // A bare key resolves against the namespaces the file actually loaded, so
  // `t("account.photo")` in a component that only asked for "auth" renders the
  // key itself. The union across the file is deliberate: several components in
  // one file may load different sets, and over-approximating avoids false
  // alarms at the cost of missing a few real ones.
  const declared = new Set();
  for (const [, group] of source.matchAll(DECLARED_NAMESPACES)) {
    for (const [, name] of group.matchAll(/["']([a-z]+)["']/g)) declared.add(name);
  }

  if (declared.size) {
    for (const [, key] of source.matchAll(BARE_KEY)) {
      const found = [...declared].some((namespace) => catalog.get(namespace)?.has(key));
      if (!found) {
        missing.push(
          `${relative}\n      "${key}" is in none of [${[...declared].join(", ")}]`,
        );
      }
    }
  }

  // A file that asks for a key needs somewhere for `t` to come from. Getting
  // this wrong is a crash on render rather than a missing string, and it is
  // easy to do when the call lands in a helper defined above the component.
  if (NAMESPACED_CALL.test(source) && !PROVIDES_T.some((rule) => rule.test(source))) {
    unbound.push(`${relative} calls t() with nothing to bind it`);
  }

  if (USES_HOOK.test(source) && !/from "react-i18next"/.test(source)) {
    unbound.push(`${relative} calls useTranslation without importing it`);
  }

  for (const match of source.matchAll(DYNAMIC_KEY)) {
    if (match[2]?.includes("defaultValue")) continue;
    unguarded.push(`${relative}\n      \`${match[1]}\` has no defaultValue`);
  }
}

if (unguarded.length) {
  // Grouped by pattern rather than by call site: the same key shape appears in
  // every branch of a component, and a wall of duplicates is how a warning
  // stops being read.
  const byPattern = new Map();
  for (const entry of unguarded) {
    const [file, detail] = entry.split("\n      ");
    const pattern = detail.replace(" has no defaultValue", "");
    if (!byPattern.has(pattern)) byPattern.set(pattern, new Set());
    byPattern.get(pattern).add(file.trim());
  }

  console.warn(
    `\n${byPattern.size} dynamic key pattern(s) without a defaultValue.\n\n` +
      "  A pattern fed from a fixed list (an enum, a constant array) is fine.\n" +
      "  One fed from stored data is not: an unexpected value renders as a raw\n" +
      "  key, and in production nothing is logged. Pass { defaultValue } there.\n",
  );
  for (const [pattern, files] of byPattern) {
    console.warn(`  ${pattern}\n      ${[...files].join("\n      ")}`);
  }
  console.warn("");
}

if (unbound.length) {
  console.error(`\nKey check failed - ${unbound.length} file(s) with no t in scope:\n`);
  for (const problem of unbound) console.error("  " + problem);
  console.error("");
  process.exit(1);
}

if (missing.length) {
  console.error(`\nKey check failed - ${missing.length} missing key(s):\n`);
  for (const problem of missing) console.error("  " + problem + "\n");
  process.exit(1);
}

const total = [...catalog.values()].reduce((sum, keys) => sum + keys.size, 0);
console.log(`Keys OK - every literal t() call resolves against ${total} catalog keys.`);
