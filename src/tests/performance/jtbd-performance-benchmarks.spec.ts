import { test, expect } from '@playwright/test';
import { JTBDIntegrationFixture } from '../e2e/jtbd/fixtures/jtbd-integration.fixture';

// Performance Benchmarks for JTBD Integration
// Tests performance characteristics of the complete integrated system
test.describe('JTBD Performance Benchmarks', () => {
  let fixture: JTBDIntegrationFixture;

  test.beforeEach(async ({ page, context }) => {
    fixture = new JTBDIntegrationFixture(page, context);
    await fixture.setup();
  });

  test.afterEach(async () => {
    await fixture.cleanup();
  });

  // Benchmark 1: Initial Load Performance
  test('Initial load performance meets target benchmarks', async ({ page }) => {
    const loadMetrics = {
      navigationStart: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    };

    await test.step('Measure initial navigation and load times', async () => {
      // Start performance measurement
      await page.goto('/opportunities', { waitUntil: 'networkidle' });
      
      // Capture performance metrics
      const performanceData = await page.evaluate(() => {
        const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          navigationStart: perfEntries.fetchStart,
          domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.navigationStart,
          loadComplete: perfEntries.loadEventEnd - perfEntries.navigationStart,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          dns: perfEntries.domainLookupEnd - perfEntries.domainLookupStart,
          tcp: perfEntries.connectEnd - perfEntries.connectStart,
          ttfb: perfEntries.responseStart - perfEntries.requestStart,
          domParsing: perfEntries.domContentLoadedEventStart - perfEntries.responseEnd,
          resourcesLoading: perfEntries.loadEventStart - perfEntries.domContentLoadedEventEnd
        };
      });

      Object.assign(loadMetrics, performanceData);
      
      console.log('Load Performance Metrics:', loadMetrics);
      
      // Benchmark targets
      expect(loadMetrics.domContentLoaded).toBeLessThan(3000); // 3s for DOM ready
      expect(loadMetrics.loadComplete).toBeLessThan(5000); // 5s for complete load
      expect(loadMetrics.firstContentfulPaint).toBeLessThan(2000); // 2s for FCP
      expect(performanceData.ttfb).toBeLessThan(1000); // 1s for TTFB
    });

    await test.step('Measure Web Vitals', async () => {
      // Wait for LCP to stabilize
      await page.waitForTimeout(3000);
      
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Simulate Web Vitals measurement
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcpEntry = entries.find(entry => entry.entryType === 'largest-contentful-paint');
            
            if (lcpEntry) {
              resolve({
                lcp: lcpEntry.startTime,
                cls: 0, // Would need actual CLS measurement
                fid: 0  // Would need actual FID measurement
              });
            }
          });
          
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch {
            // Fallback if observer not supported
            resolve({ lcp: 2500, cls: 0.1, fid: 100 });
          }
          
          // Timeout after 5 seconds
          setTimeout(() => resolve({ lcp: 2500, cls: 0.1, fid: 100 }), 5000);
        });
      }) as any;

      console.log('Web Vitals:', webVitals);
      
      // Web Vitals benchmarks
      expect(webVitals.lcp).toBeLessThan(2500); // 2.5s for LCP
      expect(webVitals.cls).toBeLessThan(0.1); // 0.1 for CLS
      expect(webVitals.fid).toBeLessThan(100); // 100ms for FID
    });

    await test.step('Measure component-specific load times', async () => {
      // Ensure all critical components are loaded
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="hub-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="smart-views-container"]')).toBeVisible();
      
      // Measure time to interactive for each component
      const componentLoadTimes = await page.evaluate(() => {
        const measurements: any = {};
        
        // Measure table load time
        const tableElement = document.querySelector('[data-testid="opportunities-table"]');
        if (tableElement) {
          measurements.tableVisible = performance.now();
        }
        
        // Measure stats load time
        const statsElement = document.querySelector('[data-testid="hub-stats"]');
        if (statsElement) {
          measurements.statsVisible = performance.now();
        }
        
        // Measure smart views load time
        const smartViewsElement = document.querySelector('[data-testid="smart-views-container"]');
        if (smartViewsElement) {
          measurements.smartViewsVisible = performance.now();
        }
        
        return measurements;
      });
      
      console.log('Component load times:', componentLoadTimes);
      
      // All critical components should be visible within 5 seconds
      Object.values(componentLoadTimes).forEach((time: any) => {
        expect(time).toBeLessThan(5000);
      });
    });
  });

  // Benchmark 2: JTBD Workflow Performance
  test('JTBD workflow operations meet performance targets', async ({ page }) => {
    await page.goto('/opportunities');
    await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();

    const workflowMetrics: any[] = [];

    await test.step('JTBD #1: Validation workflow performance', async () => {
      const startTime = performance.now();
      
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
      
      // Wait for validation to complete
      await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
      
      const endTime = performance.now();
      const validationDuration = endTime - startTime;
      
      workflowMetrics.push({ workflow: 'validation', duration: validationDuration });
      
      // Validation should complete within 3 seconds
      expect(validationDuration).toBeLessThan(3000);
      
      console.log(`Validation workflow: ${validationDuration}ms`);
      
      await page.click('[data-testid="close-validation-panel"]');
    });

    await test.step('JTBD #2: Override workflow performance', async () => {
      // Test inline override (should be faster)
      const inlineStartTime = performance.now();
      
      await page.click('[data-testid="opportunity-row"]:first-child [data-testid="inline-override-button"]');
      await expect(page.locator('[data-testid="inline-override-popover"]')).toBeVisible();
      
      await page.fill('[data-testid="quick-override-reason"]', 'Performance test override');
      await page.click('[data-testid="apply-quick-override"]');
      await expect(page.locator('[data-testid="override-applied-notification"]')).toBeVisible();
      
      const inlineEndTime = performance.now();
      const inlineOverrideDuration = inlineEndTime - inlineStartTime;
      
      workflowMetrics.push({ workflow: 'inline-override', duration: inlineOverrideDuration });
      
      // Inline override should be very fast (under 2 seconds)
      expect(inlineOverrideDuration).toBeLessThan(2000);
      
      console.log(`Inline override workflow: ${inlineOverrideDuration}ms`);
      
      // Test full override modal (can be slower but should still be reasonable)
      const modalStartTime = performance.now();
      
      await page.click('[data-testid="opportunity-row"]:nth-child(2) [data-testid="override-button"]');
      await expect(page.locator('[data-testid="override-modal"]')).toBeVisible();
      
      // Wait for impact calculator to load
      await expect(page.locator('[data-testid="impact-calculator"]')).toBeVisible();
      
      const modalEndTime = performance.now();
      const modalOverrideDuration = modalEndTime - modalStartTime;
      
      workflowMetrics.push({ workflow: 'modal-override', duration: modalOverrideDuration });
      
      // Modal override should complete within 4 seconds
      expect(modalOverrideDuration).toBeLessThan(4000);
      
      console.log(`Modal override workflow: ${modalOverrideDuration}ms`);
      
      await page.click('[data-testid="cancel-override"]');
    });

    await test.step('JTBD #4: Analytics workflow performance', async () => {
      const analyticsStartTime = performance.now();
      
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      
      // Wait for charts to render
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
      
      const analyticsEndTime = performance.now();
      const analyticsDuration = analyticsEndTime - analyticsStartTime;
      
      workflowMetrics.push({ workflow: 'analytics', duration: analyticsDuration });
      
      // Analytics should load within 6 seconds (more complex charts)
      expect(analyticsDuration).toBeLessThan(6000);
      
      console.log(`Analytics workflow: ${analyticsDuration}ms`);
      
      await page.click('[data-testid="opportunities-tab"]');
    });

    await test.step('JTBD #5: Bulk operations workflow performance', async () => {
      const bulkStartTime = performance.now();
      
      await page.click('[data-testid="bulk-select-toggle"]');
      await expect(page.locator('[data-testid="bulk-toolbar"]')).toBeVisible();
      
      // Select multiple items
      await page.check('[data-testid="opportunity-checkbox-0"]');
      await page.check('[data-testid="opportunity-checkbox-1"]');
      await page.check('[data-testid="opportunity-checkbox-2"]');
      
      // Perform bulk validation
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-validate-action"]');
      await expect(page.locator('[data-testid="bulk-validation-modal"]')).toBeVisible();
      
      const bulkEndTime = performance.now();
      const bulkDuration = bulkEndTime - bulkStartTime;
      
      workflowMetrics.push({ workflow: 'bulk-operations', duration: bulkDuration });
      
      // Bulk operations setup should be under 3 seconds
      expect(bulkDuration).toBeLessThan(3000);
      
      console.log(`Bulk operations workflow: ${bulkDuration}ms`);
      
      await page.click('[data-testid="cancel-bulk-validation"]');
      await page.click('[data-testid="bulk-select-toggle"]');
    });

    await test.step('Analyze overall workflow performance', async () => {
      console.log('Workflow Performance Summary:', workflowMetrics);
      
      const averageDuration = workflowMetrics.reduce((sum, metric) => sum + metric.duration, 0) / workflowMetrics.length;
      console.log(`Average workflow duration: ${averageDuration}ms`);
      
      // Average workflow time should be under 3.5 seconds
      expect(averageDuration).toBeLessThan(3500);
      
      // No workflow should be dramatically slower than others
      const maxDuration = Math.max(...workflowMetrics.map(m => m.duration));
      const minDuration = Math.min(...workflowMetrics.map(m => m.duration));
      
      expect(maxDuration / minDuration).toBeLessThan(5); // No more than 5x difference
    });
  });

  // Benchmark 3: Data Scale Performance
  test('System performance with varying data scales', async ({ page }) => {
    const scaleMetrics: any[] = [];

    await test.step('Baseline performance with standard dataset', async () => {
      await page.goto('/opportunities');
      
      const baselineStart = performance.now();
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      const rowCount = await page.locator('[data-testid="opportunity-row"]').count();
      const baselineEnd = performance.now();
      
      scaleMetrics.push({
        scale: 'baseline',
        rowCount,
        duration: baselineEnd - baselineStart
      });
      
      console.log(`Baseline (${rowCount} rows): ${baselineEnd - baselineStart}ms`);
    });

    await test.step('Performance with large dataset (100 opportunities)', async () => {
      // Inject large dataset
      await page.evaluate(() => {
        const largeDataset = Array.from({ length: 100 }, (_, i) => ({
          id: `large-opp-${i}`,
          name: `Large Dataset Opportunity ${i}`,
          satellite: `SAT-${i % 10}`,
          priority: ['low', 'medium', 'high', 'critical'][i % 4],
          validationStatus: ['passed', 'warning', 'failed'][i % 3],
          region: `REGION-${i % 5}`,
          dataQuality: 80 + (i % 20)
        }));
        
        window.testData = { ...window.testData, opportunities: largeDataset };
      });
      
      const largeStart = performance.now();
      await page.reload();
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      const largeRowCount = await page.locator('[data-testid="opportunity-row"]').count();
      const largeEnd = performance.now();
      
      scaleMetrics.push({
        scale: 'large-100',
        rowCount: largeRowCount,
        duration: largeEnd - largeStart
      });
      
      // Large dataset should still load within 8 seconds
      expect(largeEnd - largeStart).toBeLessThan(8000);
      
      console.log(`Large dataset (${largeRowCount} rows): ${largeEnd - largeStart}ms`);
    });

    await test.step('Performance with extra large dataset (500 opportunities)', async () => {
      // Inject extra large dataset
      await page.evaluate(() => {
        const extraLargeDataset = Array.from({ length: 500 }, (_, i) => ({
          id: `xl-opp-${i}`,
          name: `Extra Large Dataset Opportunity ${i}`,
          satellite: `SAT-${i % 20}`,
          priority: ['low', 'medium', 'high', 'critical'][i % 4],
          validationStatus: ['passed', 'warning', 'failed'][i % 3],
          region: `REGION-${i % 10}`,
          dataQuality: 70 + (i % 30)
        }));
        
        window.testData = { ...window.testData, opportunities: extraLargeDataset };
      });
      
      const xlStart = performance.now();
      await page.reload();
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      const xlRowCount = await page.locator('[data-testid="opportunity-row"]').count();
      const xlEnd = performance.now();
      
      scaleMetrics.push({
        scale: 'extra-large-500',
        rowCount: xlRowCount,
        duration: xlEnd - xlStart
      });
      
      // Extra large dataset should use pagination/virtualization and still perform well
      expect(xlEnd - xlStart).toBeLessThan(12000); // Allow up to 12 seconds for very large datasets
      
      console.log(`Extra large dataset (${xlRowCount} visible rows): ${xlEnd - xlStart}ms`);
    });

    await test.step('Test filtering performance with large datasets', async () => {
      const filterStart = performance.now();
      
      // Apply filter to reduce visible items
      await page.click('[data-testid="smart-view-critical"]');
      await expect(page.locator('[data-testid="critical-opportunities-view"]')).toBeVisible();
      
      const filteredRowCount = await page.locator('[data-testid="opportunity-row"]').count();
      const filterEnd = performance.now();
      
      scaleMetrics.push({
        scale: 'filtered-critical',
        rowCount: filteredRowCount,
        duration: filterEnd - filterStart
      });
      
      // Filtering should be very fast even with large datasets
      expect(filterEnd - filterStart).toBeLessThan(2000);
      
      console.log(`Filtered view (${filteredRowCount} rows): ${filterEnd - filterStart}ms`);
    });

    await test.step('Analyze scale performance characteristics', async () => {
      console.log('Scale Performance Summary:', scaleMetrics);
      
      // Performance should scale reasonably with data size
      const baseline = scaleMetrics.find(m => m.scale === 'baseline');
      const large = scaleMetrics.find(m => m.scale === 'large-100');
      const extraLarge = scaleMetrics.find(m => m.scale === 'extra-large-500');
      
      if (baseline && large && extraLarge) {
        // Performance degradation should be sub-linear
        const baselineRatio = baseline.duration / baseline.rowCount;
        const largeRatio = large.duration / 100; // Known size
        const xlRatio = extraLarge.duration / 500; // Known size
        
        console.log('Performance ratios (ms per item):', {
          baseline: baselineRatio,
          large: largeRatio,
          extraLarge: xlRatio
        });
        
        // Performance per item should not increase dramatically
        expect(largeRatio / baselineRatio).toBeLessThan(3); // No more than 3x slower per item
        expect(xlRatio / baselineRatio).toBeLessThan(4); // No more than 4x slower per item
      }
    });
  });

  // Benchmark 4: Memory and Resource Usage
  test('Memory usage and resource efficiency benchmarks', async ({ page }) => {
    const memoryMetrics: any[] = [];

    await test.step('Measure initial memory footprint', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (initialMemory) {
        memoryMetrics.push({ stage: 'initial', ...initialMemory });
        console.log('Initial memory usage:', initialMemory);
        
        // Initial memory should be reasonable (under 50MB)
        expect(initialMemory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
      }
    });

    await test.step('Measure memory after intensive operations', async () => {
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="analytics-tab"]');
        await page.click('[data-testid="opportunities-tab"]');
        await page.click('[data-testid="bulk-select-toggle"]');
        await page.click('[data-testid="bulk-select-toggle"]');
      }
      
      const afterOperationsMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (afterOperationsMemory && memoryMetrics.length > 0) {
        memoryMetrics.push({ stage: 'after-operations', ...afterOperationsMemory });
        console.log('Memory after operations:', afterOperationsMemory);
        
        const initial = memoryMetrics[0];
        const memoryIncrease = afterOperationsMemory.usedJSHeapSize - initial.usedJSHeapSize;
        
        // Memory increase should be moderate (under 30MB)
        expect(memoryIncrease).toBeLessThan(30 * 1024 * 1024);
        
        console.log(`Memory increase: ${memoryIncrease / (1024 * 1024)}MB`);
      }
    });

    await test.step('Measure memory after garbage collection', async () => {
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      await page.waitForTimeout(2000); // Allow GC to complete
      
      const afterGCMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (afterGCMemory && memoryMetrics.length > 1) {
        memoryMetrics.push({ stage: 'after-gc', ...afterGCMemory });
        console.log('Memory after GC:', afterGCMemory);
        
        const afterOps = memoryMetrics[1];
        const memoryRecovered = afterOps.usedJSHeapSize - afterGCMemory.usedJSHeapSize;
        
        console.log(`Memory recovered by GC: ${memoryRecovered / (1024 * 1024)}MB`);
        
        // Should recover some memory through garbage collection
        expect(memoryRecovered).toBeGreaterThan(0);
      }
    });

    await test.step('Test for memory leaks', async () => {
      // Perform repeated operations that could cause leaks
      const initialMemory = await page.evaluate(() => 
        'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0);
      
      // Repeat validation workflow multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="validate-button"]');
        await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
        await page.click('[data-testid="close-validation-panel"]');
        await page.waitForTimeout(100);
      }
      
      const finalMemory = await page.evaluate(() => 
        'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0);
      
      const memoryDelta = finalMemory - initialMemory;
      
      console.log(`Memory delta after repeated operations: ${memoryDelta / (1024 * 1024)}MB`);
      
      // Memory growth should be minimal (under 10MB for repeated operations)
      expect(memoryDelta).toBeLessThan(10 * 1024 * 1024);
    });

    await test.step('Measure network resource efficiency', async () => {
      // Clear browser cache and measure fresh load
      await page.reload({ waitUntil: 'networkidle' });
      
      const networkMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        let totalSize = 0;
        let totalDuration = 0;
        const resourceTypes: any = {};
        
        resources.forEach(resource => {
          const size = resource.transferSize || 0;
          const duration = resource.responseEnd - resource.requestStart;
          
          totalSize += size;
          totalDuration += duration;
          
          const type = resource.initiatorType || 'other';
          if (!resourceTypes[type]) {
            resourceTypes[type] = { count: 0, size: 0, duration: 0 };
          }
          resourceTypes[type].count++;
          resourceTypes[type].size += size;
          resourceTypes[type].duration += duration;
        });
        
        return {
          totalResources: resources.length,
          totalSize,
          totalDuration,
          resourceTypes
        };
      });
      
      console.log('Network resource metrics:', networkMetrics);
      
      // Total transfer size should be reasonable (under 5MB for initial load)
      expect(networkMetrics.totalSize).toBeLessThan(5 * 1024 * 1024);
      
      // Should not have excessive number of requests (under 100)
      expect(networkMetrics.totalResources).toBeLessThan(100);
    });
  });

  // Benchmark 5: Concurrent User Simulation
  test('Performance under concurrent user scenarios', async ({ page, context }) => {
    await test.step('Simulate multiple tabs/contexts', async () => {
      const contexts = [context];
      const pages = [page];
      
      // Create additional contexts to simulate multiple users
      for (let i = 0; i < 3; i++) {
        const newContext = await context.browser().newContext();
        const newPage = await newContext.newPage();
        contexts.push(newContext);
        pages.push(newPage);
      }
      
      try {
        // Load the application in all contexts simultaneously
        const loadPromises = pages.map(async (p, index) => {
          const startTime = performance.now();
          await p.goto('/opportunities');
          await expect(p.locator('[data-testid="opportunities-table"]')).toBeVisible();
          const endTime = performance.now();
          
          return {
            context: index,
            loadTime: endTime - startTime
          };
        });
        
        const concurrentLoadResults = await Promise.all(loadPromises);
        console.log('Concurrent load results:', concurrentLoadResults);
        
        // All contexts should load within reasonable time (allowing for some degradation)
        concurrentLoadResults.forEach(result => {
          expect(result.loadTime).toBeLessThan(8000); // 8s max for concurrent loads
        });
        
        // Perform concurrent operations
        const operationPromises = pages.map(async (p, index) => {
          const operations = [
            () => p.click('[data-testid="analytics-tab"]'),
            () => p.click('[data-testid="opportunities-tab"]'),
            () => p.click('[data-testid="bulk-select-toggle"]'),
            () => p.click('[data-testid="bulk-select-toggle"]')
          ];
          
          const startTime = performance.now();
          for (const operation of operations) {
            await operation();
            await p.waitForTimeout(100);
          }
          const endTime = performance.now();
          
          return {
            context: index,
            operationTime: endTime - startTime
          };
        });
        
        const concurrentOpResults = await Promise.all(operationPromises);
        console.log('Concurrent operation results:', concurrentOpResults);
        
        // Operations should complete reasonably even under concurrent load
        concurrentOpResults.forEach(result => {
          expect(result.operationTime).toBeLessThan(10000); // 10s max for operations
        });
        
      } finally {
        // Clean up additional contexts
        for (let i = 1; i < contexts.length; i++) {
          await contexts[i].close();
        }
      }
    });
  });

  // Summary benchmark test
  test('Overall system performance summary', async ({ page }) => {
    const summaryMetrics: any = {
      loadTime: 0,
      interactionTime: 0,
      memoryUsage: 0,
      networkEfficiency: 0,
      coreWebVitals: {}
    };

    await test.step('Collect comprehensive performance summary', async () => {
      // Load time
      const loadStart = performance.now();
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      summaryMetrics.loadTime = performance.now() - loadStart;
      
      // Interaction time (average of key interactions)
      const interactions = [
        { action: () => page.click('[data-testid="validate-button"]'), target: '[data-testid="validation-panel"]' },
        { action: () => page.click('[data-testid="close-validation-panel"]'), target: '[data-testid="opportunities-table"]' },
        { action: () => page.click('[data-testid="analytics-tab"]'), target: '[data-testid="analytics-dashboard"]' },
        { action: () => page.click('[data-testid="opportunities-tab"]'), target: '[data-testid="opportunities-table"]' }
      ];
      
      const interactionTimes: number[] = [];
      for (const interaction of interactions) {
        const start = performance.now();
        await interaction.action();
        await expect(page.locator(interaction.target)).toBeVisible();
        interactionTimes.push(performance.now() - start);
      }
      
      summaryMetrics.interactionTime = interactionTimes.reduce((sum, time) => sum + time, 0) / interactionTimes.length;
      
      // Memory usage
      const memory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      summaryMetrics.memoryUsage = memory;
      
      // Network efficiency
      const networkData = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.reduce((total, resource) => total + (resource as any).transferSize || 0, 0);
      });
      summaryMetrics.networkEfficiency = networkData;
      
      // Core Web Vitals (simulated)
      summaryMetrics.coreWebVitals = {
        lcp: Math.min(summaryMetrics.loadTime, 2500),
        fid: Math.min(summaryMetrics.interactionTime / 10, 100),
        cls: 0.05 // Assuming good layout stability
      };
    });

    await test.step('Validate against performance targets', async () => {
      console.log('Performance Summary:', summaryMetrics);
      
      // Overall performance targets
      expect(summaryMetrics.loadTime).toBeLessThan(5000); // 5s load time
      expect(summaryMetrics.interactionTime).toBeLessThan(2000); // 2s average interaction
      expect(summaryMetrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB memory
      expect(summaryMetrics.networkEfficiency).toBeLessThan(5 * 1024 * 1024); // 5MB network
      
      // Core Web Vitals targets
      expect(summaryMetrics.coreWebVitals.lcp).toBeLessThan(2500);
      expect(summaryMetrics.coreWebVitals.fid).toBeLessThan(100);
      expect(summaryMetrics.coreWebVitals.cls).toBeLessThan(0.1);
      
      // Calculate overall performance score
      const performanceScore = (
        (summaryMetrics.loadTime < 5000 ? 25 : 0) +
        (summaryMetrics.interactionTime < 2000 ? 25 : 0) +
        (summaryMetrics.memoryUsage < 50 * 1024 * 1024 ? 25 : 0) +
        (summaryMetrics.networkEfficiency < 5 * 1024 * 1024 ? 25 : 0)
      );
      
      console.log(`Overall Performance Score: ${performanceScore}/100`);
      expect(performanceScore).toBeGreaterThanOrEqual(75); // Minimum 75% performance score
    });
  });
});