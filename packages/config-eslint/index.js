import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/prettier";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Base ESLint config for @xndrjs packages (without React)
 * Extend this config in your package's eslint.config.js
 */
export function createBaseConfig(options = {}) {
  const { ignores = ["dist"], files = ["**/*.ts"], tsconfigRootDir } = options;

  // Use provided tsconfigRootDir or infer from caller's location
  const rootDir = tsconfigRootDir || process.cwd();

  return defineConfig([
    {
      ignores,
    },
    {
      files,
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommended,
        eslintConfigPrettier,
        eslintPluginPrettier,
      ],
      languageOptions: {
        ecmaVersion: 2023,
        globals: globals.browser,
        parserOptions: {
          tsconfigRootDir: rootDir,
        },
      },
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ]);
}

/**
 * Default base config export
 */
export default createBaseConfig();
