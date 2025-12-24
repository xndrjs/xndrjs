import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  external: [],
  esbuildOptions(options) {
    options.platform = "browser";
    options.define = {
      "process.env.NODE_ENV": '"production"',
    };
  },
});
