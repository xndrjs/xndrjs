import { createBaseConfig } from "@xndrjs/config-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createBaseConfig({
  ignores: ["dist"],
  files: ["**/*.{ts,tsx}"],
  tsconfigRootDir: __dirname,
});


