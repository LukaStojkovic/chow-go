const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// @chowgo/shared is "type": "module" with an exports map and lives outside this
// project root, so Metro needs package-exports resolution and the extra watch folder.
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push("mjs");
config.watchFolders = [require("path").resolve(__dirname, "../shared")];

module.exports = withNativeWind(config, { input: "./global.css" });
