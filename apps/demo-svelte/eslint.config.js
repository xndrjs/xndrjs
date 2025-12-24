import { createBaseConfig } from "@xndrjs/config-eslint";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  ...createBaseConfig({
    ignores: ["dist"],
    files: ["**/*.{ts,tsx}"],
    tsconfigRootDir: __dirname,
  }),
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
    rules: {
      "svelte/valid-compile": "off",
    },
  },
]);

