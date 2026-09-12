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
