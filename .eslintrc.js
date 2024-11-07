module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  globals: {
    // enable webpack require
    require: 'readonly',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'import'],
  rules: {
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
        'newlines-between': 'always',
      },
    ],
    indent: 'off',
    'linebreak-style': 'off',
    'newline-before-return': 'error',
    'no-shadow': 'error',
    'prettier/prettier': 'warn',
    quotes: 'off',
    'react/display-name': 'off',
    'react/no-direct-mutation-state': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    semi: 'off',
    'import/no-cycle': 'error',
  },
  overrides: [
    {
      // TypeScript specific rules
      files: ['*.{ts,tsx}'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
      ],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      },
      settings: {
        'import/resolver': {
          typescript: true,
        },
      },
    },
    {
      // Jest env
      files: ['test.{js,ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
