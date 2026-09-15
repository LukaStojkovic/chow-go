const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// @chowgo/shared is "type": "module" with an exports map and lives outside this
// project root, so Metro needs package-exports resolution and the extra watch folder.
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push("mjs");
config.watchFolders = [path.resolve(__dirname, "../shared")];

/**
 * Packages that must resolve to exactly one copy.
 *
 * `i18next` holds the active language in module state, and `@chowgo/shared`
 * creates the instance every screen reads from. Metro resolves a bare import
 * from the importing file outwards, so `shared/src/i18n/index.js` would find
 * `shared/node_modules/i18next` while `react-i18next` here finds this project's
 * copy - two singletons, and a language switch that moves one of them.
 *
 * This is the same reason a React Native monorepo pins `react` to one copy.
 */
const SINGLETONS = ["i18next", "react", "react-dom"];

const resolveSingleton = Object.fromEntries(
  SINGLETONS.map((name) => {
    try {
      return [name, path.dirname(require.resolve(`${name}/package.json`))];
    } catch {
      // react-dom is not installed for native; skip rather than fail the build.
      return [name, null];
    }
  }).filter(([, dir]) => dir),
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pinned = resolveSingleton[moduleName];
  if (pinned) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(__dirname, "index.js") },
      moduleName,
      platform,
    );
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
