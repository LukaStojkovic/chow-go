// app.json stays the source of truth; this only adds a build-time guard.
//
// src/lib/config.js throws at launch when a release build has no usable API
// URL, which is correct but means the failure reaches a customer's phone. EAS
// evaluates this file when it starts a build, so a preview or production
// profile with a missing, non-https or placeholder URL fails there instead.
const RELEASE_PROFILES = new Set(["preview", "production"]);

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
  return config;
};
