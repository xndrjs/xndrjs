import { defineConfig, type PluginOption } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "url";
import { getWorkspaceAliases } from "../../scripts/vite-workspace-aliases";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate workspace aliases automatically
const workspaceAliases = getWorkspaceAliases(__dirname);

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }) as PluginOption,
  ],
  clearScreen: false,
  optimizeDeps: {
    force: true, // Disable dependency optimization cache
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Automatically generated workspace aliases (use source files in dev)
      ...workspaceAliases,
    },
  },
});
