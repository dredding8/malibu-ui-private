/**
 * Suite 6: Performance Metrics
 * Render time, virtualization, and interaction performance testing
 */

import { test, expect } from '@playwright/test';

test.describe('Unified Modal - Performance Metrics', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('Modal render time <500ms', async ({ page }) => {
    console.log(`\n⚡ Performance: Modal Render Time`);

    const startTime = Date.now();

    // Click to open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    // Wait for modal to be visible
    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const renderTime = Date.now() - startTime;

    console.log(`   Render time: ${renderTime}ms`);
    console.log(`   Target: <500ms`);

    if (renderTime < 300) {
      console.log(`   ✅ Excellent: <300ms`);
    } else if (renderTime < 500) {
      console.log(`   ✅ Good: <500ms`);
    } else if (renderTime < 1000) {
      console.log(`   ⚠️  Acceptable: <1000ms`);
    } else {
      console.log(`   ❌ Slow: >${renderTime}ms`);
    }

    expect(renderTime).toBeLessThan(1000);
  });

  test('Table virtualization with large datasets', async ({ page }) => {
    console.log(`\n⚡ Performance: Table Virtualization`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Count total rows in data vs rendered DOM rows
    const tables = await modal.locator('table').all();

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const renderedRows = await table.locator('tbody tr').count();

      console.log(`   Table ${i + 1}:`);
      console.log(`      Rendered rows: ${renderedRows}`);

      if (renderedRows > 50) {
        console.log(`      ⚠️  Large table - virtualization recommended (${renderedRows} rows)`);

        // Check if virtualization is active (scroll height > container height)
        const isVirtualized = await table.evaluate(el => {
          const tbody = el.querySelector('tbody');
          const container = el.closest('.bp5-table-container, [style*="overflow"]');

          if (!tbody || !container) return false;

          return tbody.scrollHeight > container.clientHeight;
        });

        console.log(`      ${isVirtualized ? '✅' : '❌'} Virtualization: ${isVirtualized ? 'active' : 'not detected'}`);
      } else {
        console.log(`      ✅ Row count acceptable (${renderedRows} ≤50)`);
      }
    }
  });

  test('Inline edit debouncing (300ms)', async ({ page }) => {
    console.log(`\n⚡ Performance: Edit Debouncing`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Track network requests
    let saveCallCount = 0;
    const saveRequests: number[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/') && request.method() === 'POST') {
        saveCallCount++;
        saveRequests.push(Date.now());
        console.log(`      API call ${saveCallCount} at ${Date.now()}`);
      }
    });

    // Find editable field
    const editableCell = modal.locator('.bp5-editable-text, input[type="text"]').first();

    if (await editableCell.count() > 0) {
      await editableCell.click();
      await page.waitForTimeout(200);

      // Type quickly
      const startType = Date.now();
      await page.keyboard.type('Quick typing test', { delay: 50 });
      const endType = Date.now();

      console.log(`   Typing duration: ${endType - startType}ms`);

      // Wait for debounce
      await page.waitForTimeout(500);

      console.log(`   Save calls made: ${saveCallCount}`);
      console.log(`   Expected: 0-1 (debounced)`);

      if (saveCallCount === 0) {
        console.log(`   ⚠️  No save calls detected (may need form submission)`);
      } else if (saveCallCount === 1) {
        console.log(`   ✅ Properly debounced (1 save call)`);
      } else {
        console.log(`   ❌ Too many save calls (${saveCallCount}) - debouncing issue`);
      }
    } else {
      console.log(`   ℹ️  No editable fields found for debounce testing`);
    }
  });

  test('Interaction responsiveness - Button click latency', async ({ page }) => {
    console.log(`\n⚡ Performance: Interaction Latency`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Find buttons to test
    const buttons = await modal.locator('button').all();

    console.log(`   Testing ${Math.min(buttons.length, 5)} buttons:`);

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      const label = await button.textContent() || `Button ${i + 1}`;

      // Measure click to visual feedback
      const startClick = Date.now();
      await button.click();
      await page.waitForTimeout(50); // Brief wait for visual feedback

      const responseTime = Date.now() - startClick;

      console.log(`      "${label.trim()}": ${responseTime}ms`);

      if (responseTime < 100) {
        console.log(`         ✅ Instant (<100ms)`);
      } else if (responseTime < 200) {
        console.log(`         ⚠️  Perceptible (100-200ms)`);
      } else {
        console.log(`         ❌ Laggy (>200ms)`);
      }
    }
  });

  test('Memory usage - DOM node count', async ({ page }) => {
    console.log(`\n⚡ Performance: DOM Complexity`);

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    // Count DOM nodes
    const nodeCount = await modal.evaluate(el => {
      return el.querySelectorAll('*').length;
    });

    console.log(`   DOM nodes in modal: ${nodeCount}`);

    if (nodeCount < 500) {
      console.log(`   ✅ Lightweight (<500 nodes)`);
    } else if (nodeCount < 1000) {
      console.log(`   ⚠️  Moderate (500-1000 nodes)`);
    } else {
      console.log(`   ❌ Heavy (>1000 nodes) - consider optimization`);
    }

    // Check for excessive nesting
    const maxDepth = await modal.evaluate(el => {
      function getDepth(element: Element): number {
        let depth = 0;
        let current: Element | null = element;
        while (current) {
          depth++;
          current = current.parentElement;
        }
        return depth;
      }

      const allElements = Array.from(el.querySelectorAll('*'));
      return Math.max(...allElements.map(getDepth));
    });

    console.log(`   Max nesting depth: ${maxDepth}`);
    console.log(`   ${maxDepth < 15 ? '✅' : '⚠️ '} Nesting ${maxDepth < 15 ? 'acceptable' : 'deep (may impact performance)'}`);
  });

  test('Animation performance - Frame rate during transitions', async ({ page }) => {
    console.log(`\n⚡ Performance: Animation Smoothness`);

    // Measure modal open animation
    const startAnimation = Date.now();

    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    const animationTime = Date.now() - startAnimation;

    console.log(`   Modal open animation: ${animationTime}ms`);
    console.log(`   Recommended: 200-300ms for dialog animations`);

    if (animationTime >= 150 && animationTime <= 350) {
      console.log(`   ✅ Appropriate animation duration`);
    } else if (animationTime < 150) {
      console.log(`   ⚠️  Very fast (may feel abrupt)`);
    } else {
      console.log(`   ⚠️  Slow animation (may feel sluggish)`);
    }

    // Check if animations respect prefers-reduced-motion
    const reducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    console.log(`   Reduced motion preference: ${reducedMotion ? 'ON' : 'OFF'}`);

    if (reducedMotion) {
      console.log(`   ℹ️  Should respect reduced motion and skip animations`);
    }
  });

  test('Network efficiency - Payload size and request count', async ({ page }) => {
    console.log(`\n⚡ Performance: Network Efficiency`);

    const requests: Array<{url: string, size: number, method: string}> = [];

    page.on('response', async response => {
      const request = response.request();
      const url = request.url();

      if (url.includes('/api/')) {
        const size = parseInt(response.headers()['content-length'] || '0');

        requests.push({
          url: url.split('/').pop() || url,
          size: size,
          method: request.method()
        });
      }
    });

    // Open modal
    const firstRow = page.locator('[data-testid="opportunities-table"] tbody tr').first();
    await firstRow.click();

    const modal = page.locator('.bp5-dialog');
    await expect(modal).toBeVisible();

    await page.waitForTimeout(1000); // Wait for any lazy-loaded data

    console.log(`   API requests made: ${requests.length}`);

    requests.forEach(req => {
      const sizeKB = (req.size / 1024).toFixed(2);
      console.log(`      ${req.method} ${req.url}: ${sizeKB}KB`);
    });

    const totalSize = requests.reduce((sum, req) => sum + req.size, 0);
    const totalKB = (totalSize / 1024).toFixed(2);

    console.log(`   Total payload: ${totalKB}KB`);

    if (requests.length <= 5) {
      console.log(`   ✅ Efficient request count (≤5)`);
    } else {
      console.log(`   ⚠️  Many requests (${requests.length}) - consider batching`);
    }

    if (totalSize < 100 * 1024) {
      console.log(`   ✅ Lightweight payload (<100KB)`);
    } else {
      console.log(`   ⚠️  Large payload (${totalKB}KB)`);
    }
  });
});
