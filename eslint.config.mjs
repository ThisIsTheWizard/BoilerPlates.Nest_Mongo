import eslint from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.jest
      },
      sourceType: 'module'
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin
    },
    rules: {
      'arrow-body-style': ['error', 'as-needed'],
      'import/extensions': ['error', 'never', { ts: 'never' }],
      'import/named': 'error',
      'import/no-relative-packages': 'error',
      'no-prototype-builtins': 'off',
      'no-underscore-dangle': 'off',
      'no-unneeded-ternary': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', { const: 'never' }],
      'prefer-const': 'error',
      'prettier/prettier': ['error'],
      'max-params': ['error', 4],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error'
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        },
        node: { extensions: ['.js', '.ts'] }
      }
    }
  },
  { files: ['**/*.dto.ts'], rules: { indent: 'off' } },
  { ignores: ['dist', 'build', 'test/**/*.ts'] }
)
