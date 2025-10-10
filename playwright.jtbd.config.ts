import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e/jtbd',
  testMatch: '**/*.jtbd.spec.ts',
  
  // Global timeout for JTBD scenarios
  timeout: 60 * 1000, // 60 seconds for complex workflows
  
  // Expect timeout
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  // Fail on CI if test.only is left
  forbidOnly: !!process.env.CI,
  
  // Retry configuration
  retries: process.env.CI ? 2 : 1,
  
  // Parallel workers
  workers: process.env.CI ? 2 : 4,
  
  // Reporter configuration for JTBD metrics
  reporter: [
    ['html', { outputFolder: 'test-results/jtbd-report', open: 'never' }],
    ['json', { outputFile: 'test-results/jtbd-results.json' }],
    ['junit', { outputFile: 'test-results/jtbd-junit.xml' }],
    ['list'],
    process.env.CI ? ['dot'] : ['line'],
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for application
    baseURL: 'http://localhost:3000',
    
    // Trace configuration for debugging
    trace: 'on-first-retry',
    
    // Screenshot configuration for visual validation
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video recording for workflow validation
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },
    
    // Browser viewport for consistent testing
    viewport: { width: 1920, height: 1080 },
    
    // Navigation timeout
    navigationTimeout: 15000,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Locale settings for consistency
    locale: 'en-US',
    
    // Timezone for date/time testing
    timezoneId: 'America/New_York',
    
    // Extra HTTP headers for authentication/tracking
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'X-Test-Suite': 'JTBD-Validation',
    },
    
    // Performance metrics collection
    launchOptions: {
      args: [
        '--enable-precise-memory-info',
        '--disable-blink-features=AutomationControlled',
      ],
    },
  },
  
  // Configure projects for different personas and scenarios
  projects: [
    // Standard desktop testing
    {
      name: 'desktop-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // JTBD-specific context
        storageState: 'src/tests/e2e/jtbd/.auth/user.json',
      },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing for responsive JTBD
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    
    // Accessibility testing project
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force high contrast mode
        colorScheme: 'dark',
        // Reduced motion for accessibility
        reducedMotion: 'reduce',
      },
    },
    
    // Performance testing project
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // Throttle CPU and network
        launchOptions: {
          args: ['--throttle-cpu=4'],
        },
        // Slow network
        offline: false,
        httpCredentials: null,
      },
    },
  ],
  
  // Local dev server configuration
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output directory for artifacts
  outputDir: 'test-results/jtbd-artifacts',
  
  // Global setup for JTBD test environment
  globalSetup: require.resolve('./src/tests/e2e/jtbd/global-setup.ts'),
  
  // Global teardown
  globalTeardown: require.resolve('./src/tests/e2e/jtbd/global-teardown.ts'),
});