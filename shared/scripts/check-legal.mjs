// The legal documents exist in every locale with the same sections, lists and
// placeholders, so a clause added in English cannot silently be missing from
// the Serbian version a customer actually reads.
import termsEn from "../src/legal/terms.en.js";
import termsSr from "../src/legal/terms.sr.js";
import privacyEn from "../src/legal/privacy.en.js";
import privacySr from "../src/legal/privacy.sr.js";
import { LEGAL_DETAILS, checkLegalPlaceholders } from "../src/legal/index.js";

const problems = [];
const shape = (doc) =>
  doc.sections.map((s) => s.blocks.map((b) => (Array.isArray(b) ? `list:${b.length}` : "p")).join(","));
const placeholders = (doc) =>
  [...JSON.stringify(doc).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

for (const [name, en, sr] of [["terms", termsEn, termsSr], ["privacy", privacyEn, privacySr]]) {
  const a = shape(en);
  const b = shape(sr);
  if (a.length !== b.length) problems.push(`${name}: ${a.length} sections in en, ${b.length} in sr`);
  a.forEach((section, i) => {
    if (section !== b[i]) problems.push(`${name} section ${i + 1}: en [${section}] vs sr [${b[i]}]`);
  });
  if (en.intro.length !== sr.intro.length) problems.push(`${name}: intro paragraphs differ`);
  if (placeholders(en) !== placeholders(sr)) problems.push(`${name}: placeholders differ between en and sr`);
  for (const key of placeholders(en).split(",").filter(Boolean)) {
    if (!(key in LEGAL_DETAILS)) problems.push(`${name}: {${key}} is not in details.js`);
  }
}

if (problems.length) {
  console.error("Legal documents out of sync:\n  " + problems.join("\n  "));
  process.exit(1);
}
const unset = checkLegalPlaceholders();
console.log(
  `Legal OK - terms and privacy match across en / sr.` +
    (unset.length ? ` Still placeholders in details.js: ${unset.join(", ")}.` : ""),
);
