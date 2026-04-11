import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/apps/web/src', '<rootDir>/packages'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', 'integration'],
  moduleNameMapper: {
    '^@smartodo/core(.*)$': '<rootDir>/packages/core/src$1',
    '^@smartodo/ui(.*)$': '<rootDir>/packages/ui/src$1',
    '^@smartodo/plugin-sdk(.*)$': '<rootDir>/packages/plugin-sdk/src$1',
    '^@smartodo/ai(.*)$': '<rootDir>/packages/ai/src$1',
    '^@smartodo/supabase(.*)$': '<rootDir>/packages/supabase/src$1',
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};

export default config;
