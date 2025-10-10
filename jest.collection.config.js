/**
 * Jest Configuration for Collection Management Test Suite
 * 
 * Specialized Jest configuration for Wave 4 testing including
 * migration, integration, performance, and visual testing.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/tests/setup/collection-test-setup.ts'
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/components/Collection/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/tests/integration/**/*.test.{ts,tsx}',
    '<rootDir>/src/tests/performance/**/*.test.{ts,tsx}',
    '<rootDir>/src/tests/visual/**/*.test.{ts,tsx}'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/components/Collection/**/*.{ts,tsx}',
    'src/utils/collection-migration/**/*.{ts,tsx}',
    'src/hooks/collections/**/*.{ts,tsx}',
    'src/types/collection*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    },
    'src/components/Collection/': {
      branches: 90,
      functions: 95,
      lines: 98,
      statements: 98
    },
    'src/utils/collection-migration/': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'html',
    'json',
    'lcov',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/test-results/coverage/collection',
  
  // Test timeout
  testTimeout: 30000,
  
  // Performance testing configuration
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx', 
    'js',
    'jsx',
    'json'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }
  },
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results/collection-test-report',
      filename: 'index.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Collection Management Test Report'
    }],
    ['jest-junit', {
      outputDirectory: './test-results/junit',
      outputName: 'collection-test-results.xml',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test result processor
  testResultsProcessor: '<rootDir>/src/tests/utils/test-results-processor.js',
  
  // Custom environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Mock reset
  resetMocks: false,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};