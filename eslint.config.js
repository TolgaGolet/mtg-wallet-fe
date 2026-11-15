import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// `npm run lint` must stay at 0 warnings: there are no eslint-disable comments in src/
export default [
  { ignores: ["build/", "coverage/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Props are documented with JSDoc instead of PropTypes
      "react/prop-types": "off",
      // Not in CRA's react-app config either: apostrophes in JSX text are fine
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  {
    files: ["src/**/*.test.{js,jsx}", "src/setupTests.js", "src/test/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
];
