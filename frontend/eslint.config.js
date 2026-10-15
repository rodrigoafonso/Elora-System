import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'public/legacy', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAviso', 'useDependencias', 'rotas'] },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Clean Architecture: domínio e aplicação não conhecem React, HTTP nem a camada de apresentação.
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['@/application/*', '@/infrastructure/*', '@/presentation/*', 'react', 'react-*'] },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/infrastructure/*', '@/presentation/*', 'react', 'react-*'] }],
    },
  },
);
