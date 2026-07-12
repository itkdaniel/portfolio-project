import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/__tests__/**/*.test.ts"],
    reporters: ["json"],
    outputFile: { json: "./.vitest-report.json" },
  },
});
