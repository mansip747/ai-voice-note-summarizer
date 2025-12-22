import js from "@eslint/js";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { importX, createNodeResolver } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export default [
  { ignores: ["dist"] },
  globalIgnores(['./public/']),
  importX.flatConfigs.recommended,
  importX.flatConfigs.react,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: { version: "18.3" },
      'import-x/resolver-next': [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Base JavaScript rules
      ...js.configs.recommended.rules,
      eqeqeq: ["warn", "always"], // Warn on `==` and suggest `===`
      "no-var": "error", // Disallow `var`, use `let` or `const`
      "prefer-const": "warn", // Suggest using `const` over `let` when possible
      "no-unused-vars": "off", // Warn about unused variables
      "no-console": "warn", // Warn about `console.log` usage in production
      "no-alert": "warn", // Warn on `alert`, `confirm`, and `prompt`
      "no-duplicate-imports": "error", // Disallow duplicate imports

      // React-specific rules
      ...react.configs["jsx-runtime"].rules,
      "react/no-unknown-property": ["error", { ignore: ["class"] }], // Prevent using unknown properties on React elements

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "off",

      // React Refresh rules
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Additional best practices
      "no-eval": "error", // Disallow `eval()`
      "no-implied-eval": "error", // Disallow implied `eval()` through methods like `setTimeout`
      "consistent-return": "error", // Enforce consistent return statements in functions
      "default-case": "warn", // Require `default` case in `switch` statements
    },
  },
];
