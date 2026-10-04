const path = require("path");

// Same singletons metro.config.js pins: shared/ must use the app's copy of
// i18next and zod, or the active language lives in two module instances.
const singleton = (name) => path.dirname(require.resolve(`${name}/package.json`));

module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/src", "<rootDir>/app"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],
  modulePaths: ["<rootDir>/node_modules"],
  // Loads react-native-worklets' JS implementation instead of the native one.
  resolver: "react-native-worklets/jest/resolver.js",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^i18next$": singleton("i18next"),
    "^zod$": singleton("zod"),
    "^react$": singleton("react"),
    "^lucide-react-native$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|react-native-svg|lucide-react-native|nativewind|react-native-css-interop|@maplibre/.*|@gorhom/.*|@shopify/.*|i18next|react-i18next|zod)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/test/**", "!src/**/*.test.{js,jsx}"],
};
