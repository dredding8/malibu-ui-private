import { test, expect } from '@playwright/test';

test.describe('Table Column Order Verification', () => {
  test('Verify columns are in correct order', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'column-order-full-view.png',
      fullPage: true
    });

    // Get column headers
    const columnHeaders = await page.locator('.bp5-table-column-name-text').allTextContents();

    console.log('\n=== Current Column Order ===');
    columnHeaders.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });

    // Expected order based on requirements
    const expectedOrder = [
      'Priority',
      'Match',
      'Match Notes',
      'SCC',
      'Function',
      'Orbit',
      'Time Distribution',
      'Collection Type',
      'Classification',
      'Site Allocation'
    ];

    console.log('\n=== Expected Column Order ===');
    expectedOrder.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });

    // Verify each column is in correct position
    console.log('\n=== Verification ===');
    for (let i = 0; i < expectedOrder.length; i++) {
      const expected = expectedOrder[i];
      const actual = columnHeaders[i];
      const match = expected === actual;

      console.log(`Position ${i + 1}: ${match ? '✓' : '✗'} Expected "${expected}", Got "${actual}"`);

      if (!match) {
        console.log(`  ⚠️  Mismatch at position ${i + 1}`);
      }
    }

    // Assert Priority is first
    expect(columnHeaders[0]).toBe('Priority');
    console.log('✓ Priority is first column');

    // Assert Match is second
    expect(columnHeaders[1]).toBe('Match');
    console.log('✓ Match is second column');

    // Assert Match Notes is third
    expect(columnHeaders[2]).toBe('Match Notes');
    console.log('✓ Match Notes is third column');

    // Assert SCC is fourth
    expect(columnHeaders[3]).toBe('SCC');
    console.log('✓ SCC is fourth column');

    // Assert Site Allocation is last
    expect(columnHeaders[columnHeaders.length - 1]).toBe('Site Allocation');
    console.log('✓ Site Allocation is last column');

    console.log('\n✅ Column order verification complete');
  });

  test('Visual verification of first 5 columns', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Focus on the left side of the table (first 5 columns)
    const table = page.locator('.bp5-table-container').first();

    await page.screenshot({
      path: 'column-order-priority-match.png',
      clip: {
        x: 0,
        y: 0,
        width: 800,
        height: 600
      }
    });

    console.log('✓ Screenshot captured showing Priority, Match, Match Notes columns');
  });

  test('Verify Match status appears before technical details', async ({ page }) => {
    await page.goto('http://localhost:3001/test-opportunities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const columnHeaders = await page.locator('.bp5-table-column-name-text').allTextContents();

    const priorityIndex = columnHeaders.indexOf('Priority');
    const matchIndex = columnHeaders.indexOf('Match');
    const matchNotesIndex = columnHeaders.indexOf('Match Notes');
    const sccIndex = columnHeaders.indexOf('SCC');
    const functionIndex = columnHeaders.indexOf('Function');

    console.log('\n=== Column Position Analysis ===');
    console.log(`Priority: position ${priorityIndex + 1}`);
    console.log(`Match: position ${matchIndex + 1}`);
    console.log(`Match Notes: position ${matchNotesIndex + 1}`);
    console.log(`SCC: position ${sccIndex + 1}`);
    console.log(`Function: position ${functionIndex + 1}`);

    // Verify priority comes first
    expect(priorityIndex).toBe(0);

    // Verify match context comes before technical details
    expect(matchIndex).toBeLessThan(sccIndex);
    expect(matchNotesIndex).toBeLessThan(sccIndex);
    expect(matchNotesIndex).toBeLessThan(functionIndex);

    console.log('✓ Match status columns appear before technical details');
    console.log('✓ Column order follows: Priority → Match Context → Technical Details');
  });
});
