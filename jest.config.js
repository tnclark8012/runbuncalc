module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.spec.ts',
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/' ],
  setupFilesAfterEnv: ['<rootDir>/src/extensions/simulator/jest-setup.ts'],
  globals: {
    'ts-jest': {
      packageJson: 'package.json',
    },
  },
};

