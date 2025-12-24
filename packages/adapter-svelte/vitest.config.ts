import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    setupFiles: ["./setup-vitest.ts"],
  },
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@xndrjs/core": path.resolve(__dirname, "../core/src"),
    },
  },
});
