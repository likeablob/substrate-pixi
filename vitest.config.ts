import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // This is required to prevent "Invalid hook call" and "useState of null" errors in React 19.
  // Vite optimizes react/jsx-dev-runtime during the first test execution, which temporarily
  // breaks React hooks. Pre-bundling it here ensures a stable testing environment from the start.
  // ref: https://github.com/storybookjs/storybook/issues/32049
  optimizeDeps: {
    include: ["react/jsx-dev-runtime"],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
      {
        test: {
          name: "unit",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["**/*.stories.@(js|jsx|mjs|ts|tsx)"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
