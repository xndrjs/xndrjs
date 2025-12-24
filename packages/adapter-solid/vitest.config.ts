import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    setupFiles: ["./setup-vitest.ts"],
  },
  plugins: [solid()],
  resolve: {
    alias: {
      "@xndrjs/core": path.resolve(__dirname, "../core/src"),
    },
  },
});
