import type { Config } from 'jest';

const config: Config = {
  preset: './jest.preset.js',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^@/auth/(.*)$': '<rootDir>/src/$1',
    '^@/utils/(.*)$': '<rootDir>/src/packages/utils/src/$1',
    '^@/ui/(.*)$': '<rootDir>/src/packages/ui/src/$1',
    '^@/emails/(.*)$': '<rootDir>/src/packages/react-email/emails/$1',
  },
};

export default config;
