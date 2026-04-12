module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    // Prevent haste from resolving the platform-agnostic shareService to
    // shareService.native.ts. The .native.ts file is a separate module that
    // only exports destination handlers; importers of plain 'shareService'
    // always want the base (cross-platform) module.
    // Pattern 1: absolute-path imports from outside src/services/ (e.g. tests)
    '^(.*)/services/shareService$': '$1/services/shareService.ts',
    // Pattern 2: relative import from inside src/services/ (e.g. shareService.native.ts
    // importing './shareService' — without this, haste prefers .native.ts and creates
    // a circular module).
    '^\\./shareService$': '<rootDir>/src/services/shareService.ts',
    // Pattern 3: strip .js extensions on relative imports. The api/ tree
    // runs as ESM at Vercel runtime, which requires explicit .js extensions
    // on relative imports. Jest (Babel + CJS) resolves those to the source
    // .ts files, so we strip the .js suffix at test time only. Does not
    // affect production — Vercel compiles the real .js files and Node's
    // ESM loader resolves them directly.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/constants/songs.generated.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10,
    },
  },
};
