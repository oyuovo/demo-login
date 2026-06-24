import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30000,
    setupFiles: ["src/test/setup.ts"],
  },
});
