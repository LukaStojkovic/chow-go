/**
 * The Terms of Service and Privacy Policy, as structured text both clients
 * render. Kept out of the i18n catalog: they are long, change on a legal
 * rather than a product schedule, and should load only on their own pages.
 *
 * Both are drafts written against what the code does. They must be reviewed
 * by a lawyer admitted in Serbia, and every bracketed placeholder in
 * details.js replaced, before launch.
 */
import { LEGAL_DETAILS, LEGAL_UPDATED } from "./details.js";
import termsEn from "./terms.en.js";
import termsSr from "./terms.sr.js";
import privacyEn from "./privacy.en.js";
import privacySr from "./privacy.sr.js";

export { LEGAL_DETAILS, LEGAL_UPDATED };

export const LEGAL_DOCUMENTS = ["terms", "privacy"];

const DOCUMENTS = {
  terms: { en: termsEn, sr: termsSr },
  privacy: { en: privacyEn, sr: privacySr },
};

const fill = (text) => text.replace(/\{(\w+)\}/g, (match, key) => LEGAL_DETAILS[key] ?? match);

/**
 * @param {"terms" | "privacy"} kind
 * @param {string} locale Falls back to English.
 * @returns {{ title: string, updated: string, intro: string[],
 *   sections: { heading: string, blocks: (string | string[])[] }[] } | null}
 */
export function getLegalDocument(kind, locale) {
  const versions = DOCUMENTS[kind];
  if (!versions) return null;
  const doc = versions[String(locale || "").slice(0, 2)] ?? versions.en;
  return {
    title: doc.title,
    updated: LEGAL_UPDATED,
    intro: doc.intro.map(fill),
    sections: doc.sections.map((section) => ({
      heading: section.heading,
      blocks: section.blocks.map((block) => (Array.isArray(block) ? block.map(fill) : fill(block))),
    })),
  };
}

/** Placeholders still unset, for a release check. */
export function checkLegalPlaceholders() {
  return Object.entries(LEGAL_DETAILS)
    .filter(([, value]) => /^\[.*\]$/.test(value))
    .map(([key]) => key);
}
