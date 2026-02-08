module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js'
  ],
  testMatch: [
    '**/*.test.js'
  ],
  testTimeout: 10000,
  verbose: true
};
