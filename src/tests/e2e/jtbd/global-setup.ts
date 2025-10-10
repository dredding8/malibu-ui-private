import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting JTBD test environment setup...');
  
  // Create necessary directories
  const authDir = path.join(__dirname, '.auth');
  const resultsDir = path.join(config.rootDir, 'test-results');
  const jtbdDir = path.join(resultsDir, 'jtbd-artifacts');
  
  await fs.ensureDir(authDir);
  await fs.ensureDir(resultsDir);
  await fs.ensureDir(jtbdDir);
  
  // Setup test user authentication if needed
  if (!await fs.pathExists(path.join(authDir, 'user.json'))) {
    console.log('📝 Creating test user authentication state...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Navigate to login page and authenticate
      await page.goto(`${config.projects[0].use?.baseURL || 'http://localhost:3000'}/login`);
      
      // Check if we need to login (mock auth for testing)
      const needsAuth = await page.locator('[data-testid="login-form"]').isVisible().catch(() => false);
      
      if (needsAuth) {
        // Perform mock authentication
        await page.fill('[data-testid="username"]', 'jtbd-test-user');
        await page.fill('[data-testid="password"]', 'test-password');
        await page.click('[data-testid="login-button"]');
        
        // Wait for successful login
        await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
          console.log('⚠️  Mock authentication not required for this app');
        });
      }
      
      // Save authentication state
      await page.context().storageState({ path: path.join(authDir, 'user.json') });
      console.log('✅ Authentication state saved');
    } catch (error) {
      console.log('ℹ️  Authentication setup skipped:', error.message);
    } finally {
      await browser.close();
    }
  }
  
  // Initialize test metrics file
  const metricsFile = path.join(jtbdDir, 'jtbd-metrics.json');
  await fs.writeJson(metricsFile, {
    testRun: {
      startTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      config: {
        baseURL: config.projects[0].use?.baseURL,
        workers: config.workers,
        timeout: config.timeout,
      },
    },
    workflows: {},
    summary: {},
  });
  
  // Setup performance baseline if doesn't exist
  const baselineFile = path.join(jtbdDir, 'performance-baseline.json');
  if (!await fs.pathExists(baselineFile)) {
    await fs.writeJson(baselineFile, {
      workflows: {
        'jtbd-1-verify-validate': {
          duration: 120000,
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          ttfb: 600,
        },
        'jtbd-2-override-customize': {
          duration: 180000,
          lcp: 3000,
          fid: 150,
          cls: 0.15,
          ttfb: 800,
        },
        'jtbd-3-fix-data-integrity': {
          duration: 300000,
          lcp: 3500,
          fid: 200,
          cls: 0.2,
          ttfb: 1000,
        },
        'jtbd-4-analyze-performance': {
          duration: 240000,
          lcp: 4000,
          fid: 250,
          cls: 0.25,
          ttfb: 1200,
        },
        'jtbd-5-bulk-operations': {
          duration: 300000,
          lcp: 3000,
          fid: 200,
          cls: 0.15,
          ttfb: 1000,
        },
      },
    });
    console.log('📊 Performance baseline created');
  }
  
  console.log('✅ JTBD test environment setup complete');
  
  // Set environment variables for tests
  process.env.JTBD_METRICS_FILE = metricsFile;
  process.env.JTBD_BASELINE_FILE = baselineFile;
  process.env.JTBD_AUTH_DIR = authDir;
}

export default globalSetup;