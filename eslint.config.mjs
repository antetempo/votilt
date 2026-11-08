import expo from 'eslint-config-expo/flat.js';
export default [
  ...expo,
  {
    ignores: [
      '.scaffold/**',
      'android/**',
      'ios/**',
      '.local/**',
      'node_modules/**',
      'assets/**',
      'migrations/**',
    ],
  },
  {
    files: ['server/**/*.ts', 'scripts/**/*.ts', 'tests/integration/**/*.ts'],
    rules: { 'import/no-unresolved': 'off' },
  },
];
