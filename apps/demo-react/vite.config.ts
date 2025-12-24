import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";
import { getWorkspaceAliases } from "../../scripts/vite-workspace-aliases";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate workspace aliases automatically
const workspaceAliases = getWorkspaceAliases(__dirname);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() as PluginOption],
  clearScreen: false,
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  optimizeDeps: {
    force: true, // Disable dependency optimization cache
  },
  resolve: {
    alias: {
      // Automatically generated workspace aliases (use source files in dev)
      ...workspaceAliases,
    },
  },
});
