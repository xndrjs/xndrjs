import { createBaseConfig } from "@xndrjs/config-eslint";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...createBaseConfig({
    ignores: ["dist"],
    files: ["**/*.{ts,tsx}"],
  }),
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  },
]);

