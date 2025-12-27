/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/tests/**',
    '!**/*.test.js',
    '!**/prisma/**',
  ],

  // Coverage thresholds (start modest, increase over time)
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Timeout for tests (10 seconds)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
};
