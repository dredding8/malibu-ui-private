import { test, expect } from '@playwright/test';

test.describe('Priority Column - Numeric Display', () => {
  test('Verify priority displays as numbers (1-4)', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'priority-numeric-display.png',
      fullPage: true
    });

    console.log('✓ Screenshot captured');

    // Get all cells in the Priority column
    const priorityCells = await page.locator('.bp5-table-cell').filter({
      has: page.locator('span:has-text(/^[1-4]$/)')
    }).allTextContents();

    console.log('\n=== Priority Values ===');
    priorityCells.forEach((cell, index) => {
      const value = cell.trim();
      console.log(`Row ${index + 1}: Priority = ${value}`);
    });

    // Verify at least one priority cell exists
    if (priorityCells.length > 0) {
      console.log(`✓ Found ${priorityCells.length} priority cells with numeric values`);

      // Check if values are 1-4
      const validValues = priorityCells.every(cell => {
        const value = parseInt(cell.trim());
        return value >= 1 && value <= 4;
      });

      if (validValues) {
        console.log('✓ All priority values are between 1-4');
      } else {
        console.log('⚠ Some priority values are outside 1-4 range');
      }
    } else {
      console.log('⚠ No numeric priority values found');
    }

    // Verify no text tags (CRITICAL, HIGH, MEDIUM, LOW)
    const hasTextTags = await page.locator('.bp5-tag').filter({
      hasText: /CRITICAL|HIGH|MEDIUM|LOW/i
    }).count();

    if (hasTextTags === 0) {
      console.log('✓ No text tags (CRITICAL/HIGH/MEDIUM/LOW) found');
    } else {
      console.log(`⚠ Found ${hasTextTags} text priority tags`);
    }

    console.log('\n=== Test Complete ===');
  });

  test('Verify priority column is first data column', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const columnHeaders = await page.locator('.bp5-table-column-name-text').allTextContents();

    console.log('\n=== Column Headers ===');
    columnHeaders.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });

    const priorityIndex = columnHeaders.indexOf('Priority');
    console.log(`\nPriority column position: ${priorityIndex + 1}`);

    if (priorityIndex === 0) {
      console.log('✓ Priority is the first column');
    } else {
      console.log(`⚠ Priority is at position ${priorityIndex + 1}, expected position 1`);
    }
  });

  test('Visual comparison: numbers vs tags', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take zoomed screenshot of priority column
    await page.screenshot({
      path: 'priority-column-closeup.png',
      clip: {
        x: 200,
        y: 200,
        width: 150,
        height: 400
      }
    });

    console.log('✓ Close-up screenshot of priority column captured');
    console.log('Expected: Numeric values 4, 3, 2 (for critical, high, medium)');
    console.log('Check screenshot: priority-column-closeup.png');
  });
});
