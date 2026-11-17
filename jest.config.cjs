module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.spec.ts',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/', '<rootDir>/app/dist/', '<rootDir>/app/android/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/app/dist/', '<rootDir>/app/android/'],
  setupFilesAfterEnv: ['<rootDir>/src/extensions/simulator/jest-setup.ts'],
  globals: {
    'ts-jest': {
      packageJson: 'package.json',
    },
  },
};

