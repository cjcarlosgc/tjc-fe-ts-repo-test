import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as never],
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: [
        "src/modules/**/{domain,services,repositories}/**/*.ts",
        "src/shared/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/types.ts"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
