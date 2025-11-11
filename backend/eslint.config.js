// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginNode from "eslint-plugin-node";

export default [
  {
    files: ["src/**/*.js"],
    ignores: ["node_modules", "tests", "coverage", "jest.setup.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: pluginImport,
      node: pluginNode,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "import/no-unresolved": "off",
      "node/no-unsupported-features/es-syntax": "off",
      semi: ["error", "always"],
      quotes: ["error", "single"],
    },
  },
];
