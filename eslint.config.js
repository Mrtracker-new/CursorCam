import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'warn',

      // Best practices
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-console': 'off', // Allow console for debugging visualizations

      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-cond-assign': 'error',
      'no-duplicate-imports': 'error',

      // ES6+
      'arrow-spacing': 'error',
      'template-curly-spacing': ['error', 'never'],
      'object-shorthand': ['warn', 'always'],

      // Styling (handled by Prettier, but good to enforce)
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '.vite/', '**/*.d.ts'],
  },
];
