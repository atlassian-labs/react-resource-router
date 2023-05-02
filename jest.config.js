// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

module.exports = {
  clearMocks: true,
  coverageDirectory: './coverage/',
  resetMocks: true,
  setupFilesAfterEnv: ['<rootDir>jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/?(*.)*test.ts?(x)',
    '<rootDir>/codemods/**/?(*.)*test.ts?(x)',
  ],
  verbose: true,
};
