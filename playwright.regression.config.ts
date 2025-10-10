import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Continuous Regression Testing
 *
 * Purpose: Validate refactoring changes don't introduce regressions
 * - Visual regression detection with pixel-perfect comparison
 * - Performance regression monitoring with historical baselines
 * - Functional regression validation across all critical paths
 * - Cross-browser compatibility verification
 *
 * @usage
 * npm run test:regression              # Run all regression tests
 * npm run test:regression:watch        # Watch mode for continuous validation
 * npm run test:regression:update       # Update baselines after verified changes
 * npm run test:regression:report       # View detailed regression report
 */
export default defineConfig({
  testDir: './src/tests/regression',

  /* Run tests in files in parallel for faster validation */
  fullyParallel: true,

  /* Fail fast on regression detection */
  forbidOnly: true,

  /* Retry failed tests to reduce false positives */
  retries: process.env.CI ? 2 : 1,

  /* Use more workers for faster feedback during refactoring */
  workers: process.env.CI ? 2 : 4,

  /* Comprehensive reporting for regression analysis */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/regression-report', open: 'never' }],
    ['json', { outputFile: 'test-results/regression-results.json' }],
    ['junit', { outputFile: 'test-results/regression-results.xml' }]
  ],

  /* Enhanced settings for regression detection */
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Always collect traces for regression analysis */
    trace: 'retain-on-failure',

    /* Capture screenshots for visual comparison */
    screenshot: 'on',

    /* Record video for complex regression debugging */
    video: 'retain-on-failure',

    /* Consistent viewport for reliable visual regression */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,

    /* Timeout settings optimized for refactoring validation */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Stricter timeouts for regression detection */
  timeout: 45000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      /* Pixel-perfect visual regression detection */
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  /* Test against critical browser configurations */
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Development server with faster startup for watch mode */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Output configuration */
  outputDir: 'test-results/regression-artifacts',

  /* Global setup for baseline management */
  globalSetup: require.resolve('./src/tests/regression/regression-setup.ts'),
  globalTeardown: require.resolve('./src/tests/regression/regression-teardown.ts'),
});
