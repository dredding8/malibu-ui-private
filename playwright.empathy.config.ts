import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for empathy-driven testing
 * Focuses on real-world operator scenarios and challenging conditions
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  
  // Run tests in files in parallel for efficiency
  fullyParallel: true,
  
  // Fail the build on CI if test.only is left in
  forbidOnly: !!process.env.CI,
  
  // Retry on CI to handle flakiness
  retries: process.env.CI ? 2 : 1,
  
  // Use fewer workers on CI for stability
  workers: process.env.CI ? 2 : 4,
  
  // Comprehensive reporting for debugging user journeys
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/empathy-results.json' }],
    ['junit', { outputFile: 'test-results/empathy-results.xml' }],
    ['list'],
    // Custom reporter for accessibility violations
    ['./src/tests/e2e/reporters/accessibility-reporter.ts']
  ],
  
  // Global test configuration
  use: {
    // Base URL for the running application
    baseURL: 'http://localhost:3000',
    
    // Capture detailed traces for debugging
    trace: 'on-first-retry',
    
    // Screenshot configuration
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    // Video configuration for user journey analysis
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },
    
    // Simulate real-world network conditions
    // Default to "Good 3G" for realistic mobile testing
    offline: false,
    
    // Emulate real device capabilities
    hasTouch: false,
    isMobile: false,
    
    // Slow down actions to match human speed
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // Add slight delay to simulate human interaction
    launchOptions: {
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 100,
    },
    
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
    
    // Accessibility testing
    contextOptions: {
      reducedMotion: 'reduce',
      forcedColors: 'none', // Will be overridden per project
    },
  },
  
  // Test timeout for complex user journeys
  timeout: 60000,
  
  // Assertion timeout
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  
  // Real-world testing scenarios
  projects: [
    // Desktop scenarios
    {
      name: 'Desktop Chrome - Normal Conditions',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    
    {
      name: 'Desktop Firefox - High DPI',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2, // Retina display
      },
    },
    
    // Tablet scenarios
    {
      name: 'iPad - Field Operations',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
        // Simulate outdoor brightness compensation
        colorScheme: 'light',
      },
    },
    
    {
      name: 'iPad - Night Shift',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
        colorScheme: 'dark',
      },
    },
    
    // Accessibility scenarios
    {
      name: 'High Contrast Mode',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          forcedColors: 'active',
        },
      },
    },
    
    {
      name: 'Screen Reader Testing',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable screen reader testing mode
        bypassCSP: true,
        javaScriptEnabled: true,
      },
    },
    
    // Network condition scenarios
    {
      name: 'Slow 3G Network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Simulate slow network
        launchOptions: {
          slowMo: 250,
        },
        // Custom network conditions
        contextOptions: {
          offline: false,
        },
      },
      // Override network conditions in test
      metadata: {
        network: {
          downloadThroughput: 50 * 1024, // 50kb/s
          uploadThroughput: 20 * 1024, // 20kb/s
          latency: 400, // 400ms latency
        },
      },
    },
    
    {
      name: 'Offline Mode',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        offline: true,
      },
    },
    
    // Stress testing scenarios
    {
      name: 'CPU Throttled',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--enable-automation'],
        },
      },
      metadata: {
        cpuThrottling: 6, // 6x slowdown
      },
    },
    
    // Mobile scenarios
    {
      name: 'Mobile - Small Screen',
      use: {
        ...devices['iPhone SE'],
        hasTouch: true,
        isMobile: true,
      },
    },
    
    // Localization testing
    {
      name: 'RTL Language Support',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        locale: 'ar-SA',
        timezoneId: 'Asia/Riyadh',
      },
    },
    
    // Senior operator scenario (larger text)
    {
      name: 'Zoomed Interface',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1.5,
      },
    },
  ],
  
  // Development server configuration
  webServer: {
    command: process.env.CI ? 'npm run build && npm run serve' : 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output directory for test artifacts
  outputDir: 'test-results/empathy-tests/',
  
  // Global setup for empathy testing
  globalSetup: require.resolve('./src/tests/e2e/empathy-global-setup.ts'),
  globalTeardown: require.resolve('./src/tests/e2e/empathy-global-teardown.ts'),
  
  // Custom test match pattern
  testMatch: ['**/*user-journeys*.spec.ts', '**/*empathy*.spec.ts'],
  
  // Environment variables for testing
  use: {
    // Custom test attributes
    testIdAttribute: 'data-testid',
  },
});