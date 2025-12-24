import { createBaseConfig } from "@xndrjs/config-eslint";
import { defineConfig } from "eslint/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  ...createBaseConfig({
    ignores: ["dist"],
    files: ["**/*.ts"],
    tsconfigRootDir: __dirname,
  }),
]);

