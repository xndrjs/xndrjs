import { createBaseConfig } from "@xndrjs/config-eslint";

export default createBaseConfig({
  ignores: ["dist"],
  files: ["**/*.ts"],
});

