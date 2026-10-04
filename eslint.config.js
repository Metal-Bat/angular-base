// eslint.config.js
// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  { ignores: ["src/app/core/transport/generated/**"] },
  {
    ignores: [
      ".angular/**",
      ".nx/**",
      "coverage/**",
      "dist/**",
      "src/app/core/transport/generated/**",
    ],
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: ["attribute", "element"],
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // Angular best practices
      "@angular-eslint/no-empty-lifecycle-method": "warn",
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@angular-eslint/prefer-output-readonly": "warn",
      "@angular-eslint/prefer-signals": "warn",
      "@angular-eslint/prefer-standalone": "warn",

      // TypeScript best practices
      "@typescript-eslint/array-type": ["warn"],
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/consistent-type-assertions": "warn",
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "no-public",
        },
      ],
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
        },
      ],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/no-unused-vars": "warn",

      // JavaScript best practices
      eqeqeq: "error",
      complexity: ["error", 20],
      curly: "error",
      "guard-for-in": "error",
      "max-classes-per-file": ["error", 1],
      "max-len": [
        "warn",
        {
          code: 120,
          comments: 160,
        },
      ],
      "max-lines": ["error", 400], // my favorite rule to keep files small
      "no-bitwise": "error",
      "no-console": "off",
      "no-new-wrappers": "error",
      "no-useless-concat": "error",
      "no-var": "error",
      "no-restricted-syntax": "off",
      "no-shadow": "error",
      "one-var": ["error", "never"],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          allowSeparatedGroups: true,
        },
      ],

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Angular template best practices
      "@angular-eslint/template/attributes-order": [
        "error",
        {
          alphabetical: true,
          order: [
            "STRUCTURAL_DIRECTIVE", // deprecated, use @if and @for instead
            "TEMPLATE_REFERENCE", // e.g. <input #inputRef>
            "ATTRIBUTE_BINDING", // e.g. <input required>, id="3"
            "INPUT_BINDING", // e.g. [id]="3", [attr.colspan]="colspan",
            "TWO_WAY_BINDING", // e.g. [(id)]="id",
            "OUTPUT_BINDING", // e.g. (idChange)="handleChange()",
          ],
        },
      ],
      "@angular-eslint/template/button-has-type": "warn",
      "@angular-eslint/template/cyclomatic-complexity": [
        "warn",
        { maxComplexity: 10 },
      ],
      "@angular-eslint/template/eqeqeq": "error",
      "@angular-eslint/template/prefer-control-flow": "error",
      "@angular-eslint/template/prefer-ngsrc": "warn",
      "@angular-eslint/template/prefer-self-closing-tags": "warn",
      "@angular-eslint/template/use-track-by-function": "warn",
    },
  },
  {
    files: ["src/app/**/*.ts"],
    ignores: ["src/app/features/**/infrastructure/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@foblex/**"],
              message:
                "Keep canvas-library types inside infrastructure adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/features/**/infrastructure/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/presentation/**",
                "primeng",
                "primeng/**",
                "@angular/material/**",
              ],
              message:
                "Infrastructure adapters must not depend on presentation components.",
            },
          ],
        },
      ],
    },
  },
  // Layer boundaries apply to both value and type imports.
  {
    files: [
      "src/app/features/**/domain/**/*.ts",
      "src/app/features/**/application/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@angular/**",
                "primeng",
                "primeng/**",
                "rxjs",
                "rxjs/**",
                "@foblex/**",
                "**/presentation/**",
                "**/infrastructure/**",
                "**/core/**",
                "**/shared/ui/**",
                "**/generated/**",
              ],
              message:
                "Domain and application contracts must remain independent of UI, transport and framework adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/features/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@angular/**",
                "primeng",
                "primeng/**",
                "rxjs",
                "rxjs/**",
                "@foblex/**",
                "**/application/**",
                "**/presentation/**",
                "**/infrastructure/**",
                "**/core/**",
                "**/shared/ui/**",
                "**/generated/**",
              ],
              message:
                "Domain models may depend only on framework-independent domain contracts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/features/**/presentation/**/*.ts"],
    ignores: ["src/app/features/**/presentation/*.routes.ts", "**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "**/generated/**", "@foblex/**"],
              message:
                "Consume application contracts; compose infrastructure and canvas adapters at feature route boundaries.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/core/**/*.ts", "src/app/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**", "@foblex/**"],
              message:
                "Core and shared UI must not depend on feature implementations or canvas libraries.",
            },
          ],
        },
      ],
    },
  },
);
