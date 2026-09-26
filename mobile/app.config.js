// app.json stays the source of truth; this adds build variants and a guard.
//
// Variants: a dev, preview and store build each get their own id, name and
// URL scheme, so all three can be installed on one phone without one of them
// catching the others' deep links (Google sign-in returns through the
// scheme). APP_VARIANT is set per profile in eas.json; a plain `expo start`
// serves the development variant, which is what a dev client is built as.
//
// Guard: src/lib/config.js throws at launch when a release build has no usable
// API URL, which is correct but means the failure reaches a customer's phone.
// EAS evaluates this file when it starts a build, so a preview or production
// profile with a missing, non-https or placeholder URL fails there instead.
const fs = require("fs");
const path = require("path");

const RELEASE_PROFILES = new Set(["preview", "production"]);

// Android push goes through FCM, and getExpoPushTokenAsync throws without a
// Firebase config for the build's package. On EAS it is a file environment
// variable (GOOGLE_SERVICES_JSON); locally, a google-services.json here. One
// file can list the .dev and .preview packages alongside the store one.
function googleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
  const local = path.join(__dirname, "google-services.json");
  return fs.existsSync(local) ? "./google-services.json" : undefined;
}

const VARIANTS = {
  development: { suffix: ".dev", name: " (Dev)", scheme: "chowgo-dev" },
  preview: { suffix: ".preview", name: " (Preview)", scheme: "chowgo-preview" },
  production: { suffix: "", name: "", scheme: "chowgo" },
};

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  if (RELEASE_PROFILES.has(profile)) {
    const api = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();
    if (!api.startsWith("https://") || api.includes(".invalid") || /localhost|127\.0\.0\.1/.test(api)) {
      throw new Error(
        `EXPO_PUBLIC_API_URL for the "${profile}" profile is "${api || "unset"}". ` +
          "Set a real https URL in eas.json (or as an EAS environment variable) before building.",
      );
    }
  }

  const variantName = process.env.APP_VARIANT || "development";
  const variant = VARIANTS[variantName];
  if (!variant) {
    throw new Error(`APP_VARIANT "${variantName}" is not one of ${Object.keys(VARIANTS).join(", ")}.`);
  }

  return {
    ...config,
    name: `${config.name}${variant.name}`,
    scheme: variant.scheme,
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}${variant.suffix}` },
    android: {
      ...config.android,
      package: `${config.android.package}${variant.suffix}`,
      ...(googleServicesFile() ? { googleServicesFile: googleServicesFile() } : {}),
    },
    extra: { ...config.extra, appVariant: variantName },
  };
};
