// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import astroParser from "astro-eslint-parser";
import astroPlugin from "eslint-plugin-astro";
import storybook from "eslint-plugin-storybook";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**", "storybook-static/**"],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      astro: astroPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...astroPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
  },
  ...storybook.configs["flat/recommended"],
];
