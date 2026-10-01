module.exports = {
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/tests/envSetup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid')
  },
};
