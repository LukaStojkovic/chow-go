import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Source maps are built only when they can be uploaded, and deleted from dist
// afterwards: express.static would otherwise serve them to anyone who guesses
// the bundle name, "hidden" or not.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    uploadSourceMaps &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
        telemetry: false,
      }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // `@chowgo/shared` is a linked package with its own node_modules, so a bare
    // import resolved from inside it finds a second copy of these. `i18next`
    // keeps the active language in module state and the shared package owns the
    // instance every component reads, so two copies means a language switch
    // that moves only one of them - and 40kB shipped twice.
    dedupe: ["i18next", "react-i18next", "react", "react-dom", "zod"],
  },
  // Socket handlers log whole order payloads - customer name, phone and the
  // delivery address including the door code. None of that should reach a
  // production browser console.
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  build: {
    sourcemap: uploadSourceMaps ? "hidden" : false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
