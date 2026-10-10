import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    api: "src/app.ts",
  },
  format: ["esm"],
  target: "node24",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
});