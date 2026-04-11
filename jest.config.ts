import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/apps/web/src', '<rootDir>/packages', '<rootDir>/plugins'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', 'integration'],
  moduleNameMapper: {
    // Force a single React instance across all packages in tests — prevents
    // "Invalid hook call" errors caused by react@19.2.4 vs react-dom@19.2.5
    // version skew when @testing-library/react resolves a newer patch release.
    '^react$': '<rootDir>/apps/web/node_modules/react',
    '^react-dom$': '<rootDir>/apps/web/node_modules/react-dom',
    '^react-dom/(.*)$': '<rootDir>/apps/web/node_modules/react-dom/$1',
    '^@smartodo/core(.*)$': '<rootDir>/packages/core/src$1',
    '^@smartodo/ui(.*)$': '<rootDir>/packages/ui/src$1',
    '^@smartodo/plugin-sdk(.*)$': '<rootDir>/packages/plugin-sdk/src$1',
    '^@smartodo/ai(.*)$': '<rootDir>/packages/ai/src$1',
    '^@smartodo/supabase(.*)$': '<rootDir>/packages/supabase/src$1',
    '^@smartodo/plugin-sprint-board(.*)$': '<rootDir>/plugins/sprint-board/src$1',
    '^@smartodo/plugin-time-tracking(.*)$': '<rootDir>/plugins/time-tracking/src$1',
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts', '!**/node_modules/**', '!**/dist/**'],
  transform: {
    // diagnostics:false — type-checking is done separately by `pnpm run typecheck`
    // This avoids Cypress/Jest type conflicts (chai vs jest globals) in the ts-jest compile step
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.test.json', diagnostics: false }],
  },
};

export default config;
