module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Academic publishing specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Code quality rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Academic data integrity rules
    'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
    'consistent-return': 'error',
    
    // Import organization
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    
    // Next.js specific
    '@next/next/no-html-link-for-pages': 'off',
  },
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};