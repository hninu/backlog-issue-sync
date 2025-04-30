import { defineConfig } from "tsup";

export default defineConfig({
  target: "node20",
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: "esm",
  external: ["punycode"],
  noExternal: [/(.*)/],
});
