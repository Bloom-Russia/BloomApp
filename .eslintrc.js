module.exports = {
  root: true,
  extends: [
    '@react-native',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended', // Добавлено
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'jest', // Добавлено
  ],
  env: {
    'react-native/react-native': true,
    'jest/globals': true, // Добавлено для Jest
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // СТРОГИЕ правила для хуков
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks:
          '(useMemo|useCallback|useImperativeHandle|useLayoutEffect|useReducer|useRef)',
        enableDangerousAutofixThisMayCauseInfiniteLoops: false,
      },
    ],

    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-unused-styles': 'warn',

    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-extra-boolean-cast': 'error',
    'no-duplicate-imports': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.{ts,tsx,js,jsx}'],
      env: {
        'jest/globals': true,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
};
