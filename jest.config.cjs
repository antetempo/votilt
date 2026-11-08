module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/components/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/utils/**/*.ts', 'src/features/voting.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.scaffold/'],
};
