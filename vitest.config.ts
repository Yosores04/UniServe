import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: ["./server/test/global-setup.ts"],
    fileParallelism: false
  }
});
