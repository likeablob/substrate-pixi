import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let commitHash = "dev-storybook";
try {
  commitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // Fallback
}

process.env.PUBLIC_COMMIT_HASH = commitHash;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/react-vite",
  core: {
    disableTelemetry: true,
  },
  env: (config) => ({
    ...config,
    PUBLIC_COMMIT_HASH: "abcde0",
  }),
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      envPrefix: ["VITE_", "PUBLIC_"],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
        },
      },
      plugins: [tailwindcss()],
    });
  },
};
export default config;
