import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/components/__tests__',
  testMatch: '**/CollectionOpportunities.e2e.test.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report/collection-opportunities' }],
    ['json', { outputFile: 'test-results/collection-opportunities.json' }],
    ['junit', { outputFile: 'test-results/collection-opportunities.xml' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers and devices */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable accessibility testing
        contextOptions: {
          reducedMotion: 'reduce',
        }
      },
    },

    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* Test against tablet viewports */
    {
      name: 'iPad Pro',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 768 }
      },
    },

    /* Test against mobile viewports */
    {
      name: 'iPhone 14',
      use: { 
        ...devices['iPhone 14'],
        viewport: { width: 375, height: 667 }
      },
    },

    {
      name: 'Pixel 7',
      use: { 
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 }
      },
    },

    /* Test with different color schemes */
    {
      name: 'Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },

    /* Test with reduced motion for accessibility */
    {
      name: 'Reduced Motion',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
        }
      },
    },

    /* Test with forced colors for accessibility */
    {
      name: 'High Contrast',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          forcedColors: 'active',
        }
      },
    }
  ],

  /* Run local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});