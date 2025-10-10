import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  testMatch: '**/visual-*.spec.ts',
  
  // Timeout for visual tests
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  
  // Fail on CI if test.only
  forbidOnly: !!process.env.CI,
  
  // Retry configuration
  retries: process.env.CI ? 2 : 0,
  
  // Run tests in parallel
  workers: process.env.CI ? 2 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report', open: 'never' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
  ],
  
  // Shared settings
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Trace for debugging
    trace: 'on-first-retry',
    
    // Screenshot options
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video disabled for visual tests
    video: 'off',
    
    // Consistent viewport
    viewport: { width: 1920, height: 1080 },
    
    // Navigation timeout
    navigationTimeout: 10000,
    
    // Locale for consistency
    locale: 'en-US',
    
    // Timezone for consistency
    timezoneId: 'America/New_York',
    
    // Device scale factor for consistent screenshots
    deviceScaleFactor: 1,
    
    // Disable animations for consistent screenshots
    launchOptions: {
      args: ['--force-device-scale-factor=1'],
    },
  },
  
  // Configure projects for different browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable GPU for consistent rendering
        launchOptions: {
          args: ['--disable-gpu', '--force-device-scale-factor=1'],
        },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings for consistency
        launchOptions: {
          firefoxUserPrefs: {
            'ui.systemUsesDarkTheme': 0,
            'prefers-reduced-motion': 1,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific settings
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        hasTouch: true,
        isMobile: true,
      },
    },
    
    // Tablet viewport
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
      },
    },
    
    // High contrast mode testing
    {
      name: 'high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },
  ],
  
  // Local dev server
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Output directory
  outputDir: 'test-results/visual-artifacts',
  
  // Snapshot directory
  snapshotDir: 'test-results/visual-baselines',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}',
});