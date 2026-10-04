import { afterEach } from "vitest";

import { changeLanguage, initI18n } from "../src/i18n/index.js";

initI18n({ locale: "en" });

afterEach(async () => {
  await changeLanguage("en");
});
