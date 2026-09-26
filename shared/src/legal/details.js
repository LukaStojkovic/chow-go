/**
 * The operator's details, substituted into both legal documents wherever
 * `{company}`, `{address}` and the rest appear.
 *
 * Every value in square brackets is a placeholder that must be replaced with
 * the real registered details before launch. `checkLegalPlaceholders` (see
 * index.js) lists any that remain, and the pages show them in brackets so a
 * missing one is visible rather than silently blank.
 */
export const LEGAL_DETAILS = {
  company: "[Company legal name]",
  address: "[Registered address, city, postcode]",
  registrationNumber: "[Matični broj]",
  taxNumber: "[PIB]",
  email: "[support@your-domain]",
  privacyEmail: "[privacy@your-domain]",
  phone: "[Support phone number]",
  website: "[https://your-domain]",
};

/** The date the current versions took effect, ISO format. */
export const LEGAL_UPDATED = "2026-09-27";
