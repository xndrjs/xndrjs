import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    setupFiles: ["./setup-vitest.ts"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@xndrjs/core": path.resolve(__dirname, "../core/src"),
      // Force single React instance
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
});
