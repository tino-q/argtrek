import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactPerf from "eslint-plugin-react-perf";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      // "apps-script.js",
      "vite.config.js",
      "backend/**",
    ],
  },
  {
    files: ["**/*.{js,jsx}"],
    ...js.configs.recommended,
    ...react.configs.flat.recommended,
    ...reactHooks.configs.recommended,
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-perf": reactPerf,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
        IS_LOCAL: "readonly", // Development mode flag
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // Relaxed JavaScript rules
      "no-unused-vars": [
        "error",
        // {
        //   varsIgnorePattern: "^[A-Z_]",
        //   argsIgnorePattern: "^_",
        //   ignoreRestSiblings: true,
        // },
      ],
      "no-undef": "error", // Catch undefined variables including missing imports
      "no-console": "off",
      "no-debugger": "warn",

      // Relaxed React rules - only the most important ones
      "react/prop-types": "off", // Already using PropTypes package
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/jsx-uses-react": "off", // Not needed in React 17+
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "warn",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",

      // React Hooks rules (keep these strict as they prevent bugs)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error", // Upgraded from warn to error

      // React Refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Very basic accessibility rules
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/click-events-have-key-events": "off", // Too strict for now
      "jsx-a11y/no-static-element-interactions": "off", // Too strict for now

      // Import/Export Organization
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-unused-modules": "warn",
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",

      // Performance & Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "prefer-const": "error",
      "no-var": "error",

      // React Best Practices
      "react/self-closing-comp": "error",
      "react/no-array-index-key": "error",

      // Code Quality & Consistency
      "prefer-template": "error",
      "object-shorthand": "error",
      "prefer-destructuring": ["error", { object: true, array: true }],
      "no-else-return": "error",
      curly: "error",
      eqeqeq: ["error", "always"],

      // React Hooks Extended - High Impact (errors)
      "react/jsx-no-bind": ["error", { allowArrowFunctions: true }],
      "react/jsx-key": "error", // Upgraded from warn to error
      "react/no-unstable-nested-components": "error",

      // Code Complexity - Medium Impact (warnings)
      complexity: "off", // ["warn", 15],
      "max-lines-per-function": "off", // ['warn', 100],
      "max-params": ["warn", 5],

      // React Performance - High Impact (warnings)
      "react-perf/jsx-no-new-object-as-prop": "off",
      "react-perf/jsx-no-new-array-as-prop": "off",
      "react-perf/jsx-no-new-function-as-prop": "error",
    },
  },
];
