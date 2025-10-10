import { test, expect } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

// Simple performance metrics collection
async function collectPerformanceMetrics(page: any) {
  return await page.evaluate(() => {
    const timing = window.performance.timing;
    const navigation = window.performance.navigation;
    
    return {
      timing: {
        navigationStart: timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        ttfb: timing.responseStart - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
      },
      navigation: {
        type: navigation.type,
        redirectCount: navigation.redirectCount,
      },
      memory: (window.performance as any).memory ? {
        usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
      } : null,
      resources: window.performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize || 0,
        type: r.initiatorType,
      })),
    };
  });
}

test.describe('JTBD Performance Metrics Collection', () => {
  const metricsData: any = {
    testRun: {
      startTime: new Date().toISOString(),
      environment: 'test',
      baseURL: 'http://localhost:3000',
    },
    tests: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      averageLoadTime: 0,
      averageTTFB: 0,
    }
  };

  test.afterAll(async () => {
    // Calculate summary statistics
    const loadTimes = metricsData.tests.map((t: any) => t.metrics?.timing?.loadComplete || 0);
    const ttfbTimes = metricsData.tests.map((t: any) => t.metrics?.timing?.ttfb || 0);
    
    metricsData.summary = {
      totalTests: metricsData.tests.length,
      passed: metricsData.tests.filter((t: any) => t.status === 'passed').length,
      failed: metricsData.tests.filter((t: any) => t.status === 'failed').length,
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a: number, b: number) => a + b, 0) / loadTimes.length : 0,
      averageTTFB: ttfbTimes.length > 0 ? ttfbTimes.reduce((a: number, b: number) => a + b, 0) / ttfbTimes.length : 0,
    };
    
    // Save metrics to file
    const metricsPath = path.join('test-results', 'jtbd-performance-metrics.json');
    await fs.ensureDir(path.dirname(metricsPath));
    await fs.writeJson(metricsPath, metricsData, { spaces: 2 });
    console.log(`Performance metrics saved to: ${metricsPath}`);
  });

  test('JTBD #1: Page Load Performance', async ({ page, browserName }) => {
    const testStart = Date.now();
    let testData: any = {
      name: 'Page Load Performance',
      browser: browserName,
      startTime: new Date().toISOString(),
      status: 'failed',
    };

    try {
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      const metrics = await collectPerformanceMetrics(page);
      testData.metrics = metrics;
      
      // Performance assertions
      expect(metrics.timing.ttfb).toBeLessThan(800);
      expect(metrics.timing.loadComplete).toBeLessThan(3000);
      expect(metrics.timing.domContentLoaded).toBeLessThan(2000);
      
      testData.status = 'passed';
    } catch (error: any) {
      testData.error = error.message;
      throw error;
    } finally {
      testData.duration = Date.now() - testStart;
      metricsData.tests.push(testData);
    }
  });

  test('JTBD #2: Component Interaction Performance', async ({ page, browserName }) => {
    const testStart = Date.now();
    let testData: any = {
      name: 'Component Interaction Performance',
      browser: browserName,
      startTime: new Date().toISOString(),
      status: 'failed',
      interactions: [],
    };

    try {
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      // Measure button interaction time
      const buttons = await page.locator('button').all();
      console.log(`Found ${buttons.length} buttons`);
      
      if (buttons.length > 0) {
        const interactionStart = Date.now();
        await buttons[0].click({ trial: true }); // Dry run to check clickability
        const interactionTime = Date.now() - interactionStart;
        
        testData.interactions.push({
          element: 'first-button',
          interactionTime,
          acceptable: interactionTime < 100,
        });
      }
      
      // Collect metrics after interaction
      const metrics = await collectPerformanceMetrics(page);
      testData.metrics = metrics;
      
      testData.status = 'passed';
    } catch (error: any) {
      testData.error = error.message;
      throw error;
    } finally {
      testData.duration = Date.now() - testStart;
      metricsData.tests.push(testData);
    }
  });

  test('JTBD #3: Data Loading Performance', async ({ page, browserName }) => {
    const testStart = Date.now();
    let testData: any = {
      name: 'Data Loading Performance',
      browser: browserName,
      startTime: new Date().toISOString(),
      status: 'failed',
      dataLoadMetrics: {},
    };

    try {
      // Intercept API calls to measure response times
      const apiCallMetrics: any[] = [];
      
      page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('graphql')) {
          apiCallMetrics.push({
            url: url.substring(url.lastIndexOf('/') + 1),
            status: response.status(),
            timing: response.timing(),
          });
        }
      });
      
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      // Wait for data to appear
      try {
        await page.waitForSelector('[data-testid*="opportunity"], .card, .list-item', { timeout: 5000 });
        testData.dataLoadMetrics.hasData = true;
      } catch {
        testData.dataLoadMetrics.hasData = false;
      }
      
      const metrics = await collectPerformanceMetrics(page);
      testData.metrics = metrics;
      testData.dataLoadMetrics.apiCalls = apiCallMetrics;
      
      // Check if API calls were successful
      const failedCalls = apiCallMetrics.filter(call => call.status >= 400);
      expect(failedCalls).toHaveLength(0);
      
      testData.status = 'passed';
    } catch (error: any) {
      testData.error = error.message;
      throw error;
    } finally {
      testData.duration = Date.now() - testStart;
      metricsData.tests.push(testData);
    }
  });

  test('JTBD #4: Memory Usage Analysis', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
    }
    
    const testStart = Date.now();
    let testData: any = {
      name: 'Memory Usage Analysis',
      browser: browserName,
      startTime: new Date().toISOString(),
      status: 'failed',
      memorySnapshots: [],
    };

    try {
      await page.goto('/opportunities');
      
      // Take initial memory snapshot
      const initialMemory = await collectPerformanceMetrics(page);
      testData.memorySnapshots.push({
        stage: 'initial',
        memory: initialMemory.memory,
      });
      
      // Simulate user interactions
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 100));
        await page.waitForTimeout(200);
      }
      
      // Take memory snapshot after interactions
      const afterInteractionMemory = await collectPerformanceMetrics(page);
      testData.memorySnapshots.push({
        stage: 'after-interactions',
        memory: afterInteractionMemory.memory,
      });
      
      // Check for memory leaks (simplified check)
      if (initialMemory.memory && afterInteractionMemory.memory) {
        const memoryIncrease = afterInteractionMemory.memory.usedJSHeapSize - initialMemory.memory.usedJSHeapSize;
        const percentIncrease = (memoryIncrease / initialMemory.memory.usedJSHeapSize) * 100;
        
        testData.memoryAnalysis = {
          initialHeap: initialMemory.memory.usedJSHeapSize,
          finalHeap: afterInteractionMemory.memory.usedJSHeapSize,
          increase: memoryIncrease,
          percentIncrease,
          potentialLeak: percentIncrease > 50,
        };
        
        expect(percentIncrease).toBeLessThan(50);
      }
      
      testData.status = 'passed';
    } catch (error: any) {
      testData.error = error.message;
      throw error;
    } finally {
      testData.duration = Date.now() - testStart;
      metricsData.tests.push(testData);
    }
  });

  test('JTBD #5: Accessibility Performance', async ({ page, browserName }) => {
    const testStart = Date.now();
    let testData: any = {
      name: 'Accessibility Performance',
      browser: browserName,
      startTime: new Date().toISOString(),
      status: 'failed',
      accessibilityMetrics: {},
    };

    try {
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      // Check for accessibility attributes
      const accessibilityChecks = await page.evaluate(() => {
        const results = {
          hasLandmarks: document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"]').length > 0,
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasAltTexts: Array.from(document.querySelectorAll('img')).every(img => img.hasAttribute('alt')),
          hasAriaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length,
          hasSkipLinks: document.querySelector('[href="#main"], [href="#content"]') !== null,
          focusableElements: document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
        };
        
        return results;
      });
      
      testData.accessibilityMetrics = accessibilityChecks;
      
      // Basic accessibility assertions
      expect(accessibilityChecks.hasHeadings).toBe(true);
      expect(accessibilityChecks.focusableElements).toBeGreaterThan(0);
      
      // Measure keyboard navigation performance
      const tabStart = Date.now();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      const tabTime = Date.now() - tabStart;
      
      testData.accessibilityMetrics.keyboardNavigationTime = tabTime;
      expect(tabTime).toBeLessThan(200);
      
      testData.status = 'passed';
    } catch (error: any) {
      testData.error = error.message;
      throw error;
    } finally {
      testData.duration = Date.now() - testStart;
      metricsData.tests.push(testData);
    }
  });
});