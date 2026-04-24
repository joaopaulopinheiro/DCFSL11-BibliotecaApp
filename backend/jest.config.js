export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  silent: true
};
