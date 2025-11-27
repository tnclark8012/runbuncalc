module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.spec.ts',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  setupFilesAfterEnv: ['<rootDir>/src/extensions/simulator/jest-setup.ts'],
  globals: {
    'ts-jest': {
      packageJson: 'package.json',
    },
  },
};

