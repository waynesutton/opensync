import { defineConfig } from "vitest/config";

// Run the real function handlers against an in-memory Convex backend only.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts", "src/**/*.test.tsx"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
