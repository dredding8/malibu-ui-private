import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for split view modal replacement verification tests
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  testMatch: '**/split-view-modal-replacement.spec.ts',
  
  // Test timeout
  timeout: 60 * 1000, // 60 seconds per test
  
  // Global timeout for the entire test run
  globalTimeout: 15 * 60 * 1000, // 15 minutes
  
  // Expect timeout
  expect: {
    timeout: 10000, // 10 seconds
  },

  // Fail on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Parallel execution
  workers: process.env.CI ? 1 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/split-view-html-report' }],
    ['json', { outputFile: 'test-results/split-view-results.json' }],
    ['list'],
    ['junit', { outputFile: 'test-results/split-view-junit.xml' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Trace settings
    trace: 'on-first-retry',
    
    // Video recording
    video: {
      mode: 'on-first-retry',
      size: { width: 1280, height: 720 }
    },
    
    // Screenshot on failure
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'America/New_York',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable CDP for performance metrics
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});