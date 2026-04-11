// @ts-check
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jestPlugin from 'eslint-plugin-jest';
import cypressPlugin from 'eslint-plugin-cypress';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      '.turbo/**',
      'pnpm-lock.yaml',
      'coverage/**',
    ],
  },

  // Base TypeScript rules for all .ts/.tsx files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // TypeScript handles this

      // Console
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Jest test files — relaxed unsafe rules (types from aliases may not resolve in TS service)
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    extends: [jestPlugin.configs['flat/recommended']],
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
      // Path alias imports may resolve as `any` for the TS language service in monorepos
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // jest/unbound-method understands expect(mockFn).toHaveBeenCalledWith() patterns
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'error',
    },
  },

  // Cypress test files
  {
    files: ['cypress/**/*.ts', 'cypress/**/*.cy.ts'],
    plugins: { cypress: cypressPlugin },
    rules: {
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
    },
    languageOptions: {
      globals: { ...cypressPlugin.environments?.['globals']?.globals },
    },
  },

  // Prettier must be last
  prettierConfig,
);
