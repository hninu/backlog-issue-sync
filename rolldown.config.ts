const config = {
  input: "src/index.ts",
  platform: "node",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
    sourcemap: true,
  },
};

export default config;
