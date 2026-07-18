import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/.wrangler/**'] },
  {
    files: ['worker-configuration.d.ts'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/base'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        BeforeUnloadEvent: 'readonly',
        Event: 'readonly',
        File: 'readonly',
        HTMLInputElement: 'readonly',
        confirm: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
