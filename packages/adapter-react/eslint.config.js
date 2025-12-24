import { createBaseConfig } from "@xndrjs/config-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
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
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
  },
]);




