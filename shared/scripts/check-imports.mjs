/**
 * Fail when a client imports something `@chowgo/shared` does not export.
 *
 * This package has no build step and no types, so a renamed export is invisible
 * until the bundler hits it - which on the web means a white screen on whichever
 * route happens to import it, and on native means a red screen. Neither shows up
 * until someone opens that exact screen.
 *
 * Checks every `import ... from "@chowgo/shared/<subpath>"` in the repo against
 * the module's real exports, and also verifies each subpath is listed in
 * `package.json`'s `exports` map - a module that resolves under Vite's
 * filesystem access can still be unreachable from Metro.
 *
 * Run: npm run check:imports  (from shared/)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..", "..");
const SHARED = resolve(import.meta.dirname, "..");
const SCAN = ["frontend/src", "mobile/src", "mobile/app", "backend"];

const pkg = JSON.parse(readFileSync(join(SHARED, "package.json"), "utf8"));
const exportsMap = pkg.exports || {};

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
      if (entry === "node_modules" || entry === "dist" || entry === ".expo") continue;
      out.push(...walk(full));
    } else if (/\.(jsx?|mjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Pull the named bindings out of an import statement. Default and namespace
 * imports are skipped: neither can name a binding that does not exist.
 *
 * @param {string} clause The text between `import` and `from`.
 * @returns {string[]}
 */
function namedBindings(clause) {
  const braces = clause.match(/\{([^}]*)\}/);
  if (!braces) return [];
  return braces[1]
    .split(",")
    .map((part) => part.trim().split(/\s+as\s+/)[0].trim())
    .filter(Boolean);
}

const IMPORT_RE = /import\s+([^;]*?)\s+from\s+["']@chowgo\/shared\/([^"']+)["']/g;

const files = SCAN.flatMap((dir) => walk(join(ROOT, dir)));
const problems = [];
const moduleCache = new Map();

/** @param {string} subpath @returns {Promise<string[] | null>} */
async function exportsOf(subpath) {
  if (moduleCache.has(subpath)) return moduleCache.get(subpath);

  const target = exportsMap[`./${subpath}`];
  if (!target) {
    moduleCache.set(subpath, null);
    return null;
  }

  const url = pathToFileURL(resolve(SHARED, target)).href;
  const names = Object.keys(await import(url));
  moduleCache.set(subpath, names);
  return names;
}

for (const file of files) {
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(IMPORT_RE)) {
    const [, clause, subpath] = match;
    const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");

    const available = await exportsOf(subpath);
    if (available === null) {
      problems.push(
        `${relative}\n    imports "@chowgo/shared/${subpath}", which is not in the package's exports map`,
      );
      continue;
    }

    const missing = namedBindings(clause).filter((name) => !available.includes(name));
    if (missing.length) {
      problems.push(
        `${relative}\n    "@chowgo/shared/${subpath}" does not export ${missing
          .map((name) => `\`${name}\``)
          .join(", ")}`,
      );
    }
  }
}

if (problems.length) {
  console.error(`\nImport check failed - ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

console.log(
  `Imports OK - every @chowgo/shared import across ${SCAN.join(", ")} resolves.`,
);
