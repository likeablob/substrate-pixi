// @ts-check

import { execSync } from "node:child_process";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const SITE = env.SITE || process.env.SITE || "https://example.com";
const BASE_PATH = env.BASE_PATH || process.env.BASE_PATH || "/";

let commitHash = "dev";
try {
  commitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // Fallback
}

// Set it so Astro picks it up
process.env.PUBLIC_COMMIT_HASH = commitHash;

export default defineConfig({
  site: SITE,
  base: BASE_PATH,
  integrations: [mdx(), sitemap(), react()],

  env: {
    schema: {
      PUBLIC_COMMIT_HASH: envField.string({
        context: "client",
        access: "public",
        default: "dev",
      }),
    },
  },

  vite: {
    // @ts-expect-error - Vite version mismatch between Astro and Tailwind plugin
    plugins: [tailwindcss()],
  },
});
