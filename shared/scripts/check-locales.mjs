/**
 * Fail loudly when the two catalogs drift.
 *
 * A missing key does not throw at runtime - i18next quietly falls back to
 * English, so a half-translated screen looks fine to whoever wrote it and
 * broken to everyone reading Serbian. This is the only check that catches it.
 *
 * Plural families are compared by their base key, because the languages need
 * different numbers of forms: English has `_one`/`_other`, Serbian has
 * `_one`/`_few`/`_other`. A base key present in one language and absent in the
 * other is still an error; a different set of suffixes is not.
 *
 * Run: npm run check:locales  (from shared/)
 */

import { resources, SUPPORTED_LOCALES } from "../src/i18n/index.js";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/**
 * Flatten a namespace into dotted paths, collapsing plural families.
 *
 * @param {Object} node
 * @param {string} [prefix]
 * @param {Map<string, string>} [out] path -> the leaf value, for interpolation checks.
 * @returns {Map<string, string>}
 */
function flatten(node, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, path, out);
      continue;
    }

    out.set(path.replace(PLURAL_SUFFIX, ""), String(value));
  }
  return out;
}

/** @param {string} value @returns {string[]} */
function placeholders(value) {
  return [...value.matchAll(/\{\{\s*([A-Za-z0-9_]+)/g)].map((m) => m[1]).sort();
}

const problems = [];
const [reference, ...others] = SUPPORTED_LOCALES;
const referenceNamespaces = Object.keys(resources[reference]);

for (const locale of others) {
  const namespaces = Object.keys(resources[locale]);

  for (const ns of referenceNamespaces) {
    if (!namespaces.includes(ns)) {
      problems.push(`${locale}: namespace "${ns}" is missing entirely`);
      continue;
    }

    const expected = flatten(resources[reference][ns]);
    const actual = flatten(resources[locale][ns]);

    for (const [key, value] of expected) {
      if (!actual.has(key)) {
        problems.push(`${locale}: ${ns}:${key} is missing`);
        continue;
      }

      // An interpolation the translator dropped renders a literal "{{name}}"
      // or, worse, silently loses the restaurant's name from the sentence.
      const want = placeholders(value);
      const got = placeholders(actual.get(key));
      if (want.join(",") !== got.join(",")) {
        problems.push(
          `${locale}: ${ns}:${key} interpolates {${got}} but ${reference} uses {${want}}`,
        );
      }
    }

    for (const key of actual.keys()) {
      if (!expected.has(key)) {
        problems.push(`${locale}: ${ns}:${key} has no ${reference} counterpart`);
      }
    }
  }

  for (const ns of namespaces) {
    if (!referenceNamespaces.includes(ns)) {
      problems.push(`${locale}: namespace "${ns}" has no ${reference} counterpart`);
    }
  }
}

const total = referenceNamespaces.reduce(
  (sum, ns) => sum + flatten(resources[reference][ns]).size,
  0,
);

if (problems.length) {
  console.error(`\nLocale check failed - ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("");
  process.exit(1);
}

console.log(
  `Locales OK - ${total} keys across ${referenceNamespaces.length} namespaces, ` +
    `${SUPPORTED_LOCALES.join(" / ")} in sync.`,
);

/**
 * A duplicate key in one object literal is invisible at runtime - the later
 * one silently wins and the earlier translation is simply gone. The parsed
 * catalogs cannot show it (the collision has already happened), so this reads
 * the source text and tracks brace depth.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LOCALES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/i18n/locales");
const duplicates = [];

for (const locale of SUPPORTED_LOCALES) {
  const dir = join(LOCALES_DIR, locale);
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".js"))) {
    const source = readFileSync(join(dir, file), "utf8");
    const scopes = [new Set()];
    let line = 0;

    for (const text of source.split("\n")) {
      line += 1;
      const key = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(text);
      if (key) {
        const scope = scopes[scopes.length - 1];
        if (scope.has(key[1])) {
          duplicates.push(`${locale}/${file}:${line} duplicate key "${key[1]}"`);
        }
        scope.add(key[1]);
      }

      // Only whole-line braces are tracked; every catalog is formatted that way.
      for (const char of text.replace(/"(?:[^"\\]|\\.)*"/g, "")) {
        if (char === "{") scopes.push(new Set());
        else if (char === "}") scopes.pop() ?? scopes.push(new Set());
      }
      if (scopes.length === 0) scopes.push(new Set());
    }
  }
}

if (duplicates.length) {
  console.error(`\nLocale check failed - ${duplicates.length} duplicate key(s):\n`);
  for (const problem of duplicates) console.error(`  ${problem}`);
  console.error("");
  process.exit(1);
}
