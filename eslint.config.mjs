import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typedTypeScriptConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ['**/*.ts'],
  languageOptions: {
    ...config.languageOptions,
    globals: {
      ...globals.browser,
      ...globals.node
    },
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  }
}));

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.npm-cache/',
      'reports/',
      'artifacts/',
      'screenshots/',
      'videos/',
      'traces/',
      'allure-results/',
      'allure-report/',
      'test-results/',
      'playwright-report/',
      'coverage/',
      'tools/',
      '_reference_*/'
    ]
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: globals.node
    },
    rules: js.configs.recommended.rules
  },
  ...typedTypeScriptConfigs,
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts', 'playwright.config.ts'],
    plugins: {
      playwright
    },
    rules: {
      '@typescript-eslint/require-await': 'off',
      'playwright/no-element-handle': 'warn',
      'playwright/no-page-pause': 'error',
      'playwright/no-wait-for-timeout': 'error'
    }
  },
  eslintConfigPrettier
];
