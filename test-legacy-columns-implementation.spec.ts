import { test, expect } from '@playwright/test';

/**
 * Legacy Compliance Validation Test
 *
 * Validates that all 10 required legacy columns are now present
 * in the Collection Management page table
 */

test.describe('Legacy Compliance - Column Implementation', () => {
  test('should display all 10 required legacy columns', async ({ page }) => {
    console.log('\n========================================');
    console.log('LEGACY COLUMN IMPLEMENTATION VALIDATION');
    console.log('========================================\n');

    // Navigate to collection management page
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📍 Page: Collection Management');
    console.log('URL: http://localhost:3000/collection/DECK-1757517559289/manage\n');

    // Take initial screenshot
    await page.screenshot({ path: 'legacy-columns-page.png', fullPage: true });

    // Find all table column headers
    const columnHeaders = await page.locator('.bp5-table-column-name, .bp5-table-column-name-text').allTextContents();

    console.log('🔍 Found Column Headers:');
    columnHeaders.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`);
    });

    // Required legacy columns
    const requiredColumns = [
      'Priority',
      'SCC',
      'Function',
      'Orbit',
      'Periodicity',
      'Collection Type',
      'Classification',
      'Match',
      'Match Notes',
      'Site Allocation'
    ];

    console.log('\n📋 Legacy Column Compliance Check:\n');

    const results: { column: string; present: boolean }[] = [];

    for (const column of requiredColumns) {
      const isPresent = columnHeaders.some(header =>
        header.trim().toLowerCase() === column.toLowerCase()
      );
      results.push({ column, present: isPresent });
      console.log(`  ${isPresent ? '✅' : '❌'} ${column}: ${isPresent ? 'PRESENT' : 'MISSING'}`);
    }

    const presentCount = results.filter(r => r.present).length;
    const compliancePercent = Math.round((presentCount / requiredColumns.length) * 100);

    console.log(`\n📊 COMPLIANCE SCORE: ${compliancePercent}% (${presentCount}/${requiredColumns.length} columns)\n`);

    // Check for data in the new columns
    console.log('🔍 Checking for data in legacy columns...\n');

    // Wait for table to load
    await page.waitForSelector('.bp5-table-cell', { timeout: 5000 });

    // Check Classification tags
    const classificationTags = await page.locator('.classification-tag').count();
    console.log(`  Classification tags: ${classificationTags > 0 ? '✅' : '❌'} (${classificationTags} found)`);

    // Check Match status tags
    const matchTags = await page.locator('.match-status-tag').count();
    console.log(`  Match status tags: ${matchTags > 0 ? '✅' : '❌'} (${matchTags} found)`);

    // Check SCC numbers
    const sccCells = await page.locator('.scc-number').count();
    console.log(`  SCC numbers: ${sccCells > 0 ? '✅' : '❌'} (${sccCells} found)`);

    // Check satellite functions
    const functionCells = await page.locator('.satellite-function').count();
    console.log(`  Satellite functions: ${functionCells > 0 ? '✅' : '❌'} (${functionCells} found)`);

    // Check orbits
    const orbitCells = await page.locator('.orbit-type').count();
    console.log(`  Orbit types: ${orbitCells > 0 ? '✅' : '❌'} (${orbitCells} found)`);

    // Check site allocations
    const allocationCells = await page.locator('.site-allocation').count();
    console.log(`  Site allocations: ${allocationCells > 0 ? '✅' : '❌'} (${allocationCells} found)`);

    console.log('\n========================================');
    console.log('VALIDATION COMPLETE');
    console.log('========================================\n');

    // Final screenshot
    await page.screenshot({ path: 'legacy-columns-complete.png', fullPage: true });

    // Assertions
    expect(compliancePercent).toBeGreaterThanOrEqual(100);
    expect(presentCount).toBe(10);

    // Verify at least some data is showing in the new columns
    const hasData = classificationTags > 0 || matchTags > 0 || sccCells > 0;
    expect(hasData).toBeTruthy();
  });
});
