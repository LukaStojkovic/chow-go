import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["i18next", "react-i18next", "react", "react-dom", "zod"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["src/test/setup.js"],
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/test/**", "src/**/*.test.{js,jsx}", "src/components/ui/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
