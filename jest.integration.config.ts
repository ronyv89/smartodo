import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/web/src', '<rootDir>/packages'],
  testMatch: ['**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@smartodo/core(.*)$': '<rootDir>/packages/core/src$1',
    '^@smartodo/ui(.*)$': '<rootDir>/packages/ui/src$1',
    '^@smartodo/plugin-sdk(.*)$': '<rootDir>/packages/plugin-sdk/src$1',
    '^@smartodo/ai(.*)$': '<rootDir>/packages/ai/src$1',
    '^@smartodo/supabase(.*)$': '<rootDir>/packages/supabase/src$1',
  },
  globalSetup: '<rootDir>/jest.integration.setup.ts',
  globalTeardown: '<rootDir>/jest.integration.teardown.ts',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};

export default config;
